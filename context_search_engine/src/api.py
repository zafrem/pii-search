from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time
import logging
from typing import List, Dict, Any

from .config import config
from .models import (
    ContextSearchRequest,
    ContextSearchResponse,
    ValidateEntityRequest,
    FalsePositiveCheckRequest,
    FalsePositiveCheckResponse,
    ContextAnalysisResult,
    HealthStatus,
    ModelStatus
)
from .engine import ContextSearchEngine
from .ollama_client import ollama_client
from .huggingface_client import huggingface_client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PII Search - Context Search Engine",
    description="LLM-powered context analysis and false positive filtering for PII detection",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the context search engine
engine = ContextSearchEngine()

@app.on_event("startup")
async def startup_event():
    """Initialize the engine on startup."""
    logger.info("Starting Context Search Engine...")
    try:
        await engine.initialize()
        logger.info("Context Search Engine initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize engine: {e}")
        raise

@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    try:
        # Check Ollama connectivity
        ollama_healthy = False
        available_ollama_models = []
        try:
            async with ollama_client as client:
                ollama_healthy = await client.health_check()
                available_ollama_models = await client.list_models() if ollama_healthy else []
        except Exception as e:
            logger.warning(f"Ollama health check failed: {e}")
        
        # Check HuggingFace connectivity
        huggingface_healthy = False
        try:
            async with huggingface_client as hf_client:
                huggingface_healthy = await hf_client.health_check()
        except Exception as e:
            logger.warning(f"HuggingFace health check failed: {e}")
        
        # Get engine stats
        stats = engine.get_stats()
        
        # System is healthy if at least one model is available and engine is ready
        status = "healthy" if (ollama_healthy or huggingface_healthy) and engine.is_ready() else "degraded"
        
        return {
            "status": status,
            "service": "context-search-engine",
            "version": "1.0.0",
            "timestamp": time.time(),
            "models": {
                "ollama": {
                    "connected": ollama_healthy,
                    "current_model": "llama3.2:1b" if ollama_healthy else None,
                    "available_models": [model.name for model in available_ollama_models]
                },
                "huggingface": {
                    "connected": huggingface_healthy,
                    "model": "DistilBERT" if huggingface_healthy else None
                }
            },
            "dual_model_enabled": ollama_healthy and huggingface_healthy,
            "engine_ready": engine.is_ready(),
            "uptime": stats.get("uptime", 0),
            "total_requests": stats.get("total_requests", 0),
            "error_rate": stats.get("error_rate", 0),
            "average_latency": stats.get("average_latency", 0)
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "service": "context-search-engine",
            "error": str(e),
            "timestamp": time.time()
        }

@app.get("/models")
async def list_models() -> Dict[str, Any]:
    """List available models from both Ollama and HuggingFace."""
    try:
        result = {
            "ollama": [],
            "huggingface": [],
            "total_available": 0
        }
        
        # Get Ollama models
        try:
            async with ollama_client as client:
                ollama_models = await client.list_models()
                result["ollama"] = [
                    {
                        "name": model.name,
                        "status": model.status,
                        "version": model.version,
                        "size": model.size,
                        "last_used": model.last_used,
                        "provider": "ollama"
                    }
                    for model in ollama_models
                ]
        except Exception as e:
            logger.warning(f"Failed to get Ollama models: {e}")
        
        # Get HuggingFace model info
        try:
            async with huggingface_client as hf_client:
                if await hf_client.health_check():
                    result["huggingface"] = [{
                        "name": "DistilBERT",
                        "status": "available",
                        "version": "latest",
                        "size": "unknown",
                        "last_used": None,
                        "provider": "huggingface",
                        "description": "DistilBERT-based PII detection model"
                    }]
        except Exception as e:
            logger.warning(f"Failed to get HuggingFace model info: {e}")
        
        result["total_available"] = len(result["ollama"]) + len(result["huggingface"])
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def context_search(request: ContextSearchRequest) -> Dict[str, Any]:
    """Perform context-aware PII analysis."""
    start_time = time.time()
    
    try:
        # Validate request
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")
        
        if not request.languages:
            raise HTTPException(status_code=400, detail="At least one language must be specified")
        
        if len(request.text) > config.max_text_length:
            raise HTTPException(
                status_code=400,
                detail=f"Text exceeds maximum length of {config.max_text_length} characters"
            )
        
        # Perform context search
        logger.info(f"Performing context search for {len(request.previous_detections)} entities")
        response = await engine.search(request)
        
        processing_time = time.time() - start_time
        response.processing_time = processing_time
        
        # Return in the expected API format
        return {
            "success": True,
            "data": {
                "stage": response.stage,
                "method": response.method,
                "items": [
                    {
                        "id": item.id,
                        "text": item.text,
                        "type": item.type.value,
                        "language": item.language,
                        "position": {
                            "start": item.position.start,
                            "end": item.position.end
                        },
                        "probability": item.refined_probability,
                        "confidenceLevel": item.confidence_level.value,
                        "sources": item.sources,
                        "context": item.context,
                        "analysis": {
                            "isGenuinePII": item.analysis_result.is_genuine_pii,
                            "confidence": item.analysis_result.confidence,
                            "reason": item.analysis_result.reason,
                            "riskLevel": item.analysis_result.risk_level.value,
                            "culturalContext": item.analysis_result.cultural_context,
                            "falsePositiveIndicators": item.analysis_result.false_positive_indicators,
                            "privacyImplications": item.analysis_result.privacy_implications
                        },
                        "originalProbability": item.original_probability,
                        "isValidated": item.is_validated
                    }
                    for item in response.items
                ],
                "summary": response.summary,
                "processingTime": response.processing_time,
                "modelInfo": response.model_info,
                "analysisMetadata": response.analysis_metadata
            },
            "metadata": {
                "timestamp": time.time(),
                "apiVersion": "1.0.0",
                "engine": "context-search"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Context search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Context search failed: {str(e)}")

@app.post("/validate")
async def validate_entity(request: ValidateEntityRequest) -> Dict[str, Any]:
    """Validate a single entity."""
    try:
        analysis_result = await engine.validate_entity(request)
        
        return {
            "success": True,
            "data": {
                "isGenuinePII": analysis_result.is_genuine_pii,
                "confidence": analysis_result.confidence,
                "reason": analysis_result.reason,
                "riskLevel": analysis_result.risk_level.value,
                "culturalContext": analysis_result.cultural_context,
                "falsePositiveIndicators": analysis_result.false_positive_indicators,
                "privacyImplications": analysis_result.privacy_implications
            }
        }
        
    except Exception as e:
        logger.error(f"Entity validation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@app.post("/analyze/false-positives")
async def check_false_positive(request: FalsePositiveCheckRequest) -> Dict[str, Any]:
    """Check if an entity is a false positive."""
    try:
        result = await engine.check_false_positive(request)
        
        return {
            "success": True,
            "data": {
                "isFalsePositive": result.is_false_positive,
                "confidence": result.confidence,
                "explanation": result.explanation,
                "indicators": result.indicators
            }
        }
        
    except Exception as e:
        logger.error(f"False positive check failed: {e}")
        raise HTTPException(status_code=500, detail=f"False positive check failed: {str(e)}")

@app.get("/stats")
async def get_engine_stats() -> Dict[str, Any]:
    """Get engine performance statistics."""
    try:
        stats = engine.get_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug")
async def get_debug_info() -> Dict[str, Any]:
    """Get debug information about the last context search request."""
    try:
        debug_info = engine.get_debug_info()
        return {
            "success": True,
            "data": debug_info
        }
    except Exception as e:
        logger.error(f"Failed to get debug info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host=config.server_host,
        port=config.server_port,
        workers=config.server_workers,
        reload=config.debug,
        log_level="info"
    )