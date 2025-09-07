from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import time
import logging
from typing import List, Dict, Any

from .config import config
from .models import (
    DeepSearchRequest, 
    DeepSearchResponse, 
    TrainingRequest, 
    ModelInfo,
    PIIClassificationResult
)
from .engine import DeepSearchEngine
from .model_manager import ModelManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="PII Search - Deep Search Engine",
    description="Deep learning-based PII detection engine with ML Classification and context analysis",
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

# Initialize the deep search engine and model manager
engine = DeepSearchEngine()
model_manager = ModelManager()

@app.on_event("startup")
async def startup_event():
    """Initialize the engine on startup."""
    logger.info("Starting Deep Search Engine...")
    try:
        await engine.initialize()
        logger.info("Deep Search Engine initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize engine: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "deep-search-engine",
        "version": "1.0.0",
        "timestamp": time.time(),
        "models_loaded": engine.is_ready()
    }

@app.get("/models")
async def list_models() -> Dict[str, Any]:
    """List available models."""
    try:
        models = model_manager.get_available_models()
        return {
            "success": True,
            "data": models
        }
    except Exception as e:
        logger.error(f"Error listing models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search")
async def deep_search(request: DeepSearchRequest) -> Dict[str, Any]:
    """Perform deep PII search using binary ML Classification (PII/non-PII) and context analysis."""
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
        
        # Perform deep search
        logger.info(f"Performing deep search for {len(request.languages)} languages")
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
                        "classification": item.classification.value,
                        "language": item.language,
                        "position": {
                            "start": item.position.start,
                            "end": item.position.end
                        },
                        "probability": item.probability,
                        "confidenceLevel": item.confidence_level.value,
                        "sources": item.sources,
                        "context": item.context
                    }
                    for item in response.items
                ],
                "summary": response.summary,
                "processingTime": response.processing_time,
                "modelInfo": response.model_info
            },
            "metadata": {
                "timestamp": time.time(),
                "apiVersion": "1.0.0",
                "engine": "deep-search"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deep search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Deep search failed: {str(e)}")

@app.post("/train")
async def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """Train or fine-tune a model (background task)."""
    try:
        # Add training task to background
        background_tasks.add_task(engine.train_model, request)
        
        return {
            "success": True,
            "message": "Training started",
            "request": {
                "model_name": request.model_name,
                "languages": request.languages,
                "epochs": request.epochs
            }
        }
        
    except Exception as e:
        logger.error(f"Training initiation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@app.get("/training/status")
async def get_training_status():
    """Get current training status."""
    try:
        status = await engine.get_training_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        logger.error(f"Failed to get training status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/training/data")
async def add_training_data(training_data: List[Dict[str, Any]]):
    """Add training data from labeling system."""
    try:
        logger.info(f"Received {len(training_data)} training samples")
        await engine.add_training_data(training_data)
        
        return {
            "success": True,
            "message": f"Added {len(training_data)} training samples",
            "data": {
                "samples_added": len(training_data),
                "timestamp": time.time()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to add training data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/engine/mode")
async def set_engine_mode(mode_data: Dict[str, bool]):
    """Set engine mode (simple or advanced)."""
    try:
        use_simple = mode_data.get("use_simple", True)
        engine.set_engine_mode(use_simple)
        
        return {
            "success": True,
            "message": f"Engine mode set to {'Simple' if use_simple else 'Advanced'}",
            "data": {
                "use_simple": use_simple,
                "timestamp": time.time()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to set engine mode: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Model Management Endpoints

@app.post("/model/deploy")
async def deploy_model(deploy_data: Dict[str, Any]):
    """Deploy a specific model version as the active model."""
    try:
        model_version = deploy_data.get("model_version")
        replace_current = deploy_data.get("replace_current", True)
        
        if not model_version:
            raise HTTPException(status_code=400, detail="model_version is required")
        
        # Deploy the model
        model_manager.deploy_model(model_version, replace_current)
        
        # Reload the engine with the new model
        await engine.reload_model()
        
        return {
            "success": True,
            "message": f"Model {model_version} deployed successfully",
            "data": {
                "model_version": model_version,
                "deployed_at": time.time()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to deploy model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/model/backup")
async def backup_current_model():
    """Create a backup of the current active model."""
    try:
        backup_id = model_manager.create_backup()
        
        return {
            "success": True,
            "message": "Model backup created successfully",
            "data": {
                "backup_id": backup_id,
                "created_at": time.time()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to create model backup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/model/rollback")
async def rollback_model(rollback_data: Dict[str, str]):
    """Rollback to a previous model backup."""
    try:
        backup_id = rollback_data.get("backup_id")
        
        if not backup_id:
            raise HTTPException(status_code=400, detail="backup_id is required")
        
        # Rollback the model
        model_manager.rollback_model(backup_id)
        
        # Reload the engine with the restored model
        await engine.reload_model()
        
        return {
            "success": True,
            "message": f"Successfully rolled back to backup {backup_id}",
            "data": {
                "backup_id": backup_id,
                "rolled_back_at": time.time()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to rollback model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Cascaded Detection Endpoints

@app.post("/detection/set-cascaded")
async def set_cascaded_detection(cascaded_data: Dict[str, Any]):
    """Enable or disable cascaded detection mode."""
    try:
        enabled = cascaded_data.get("enabled", False)
        success = engine.set_cascaded_detection(enabled)
        
        if not success:
            return {
                "success": False,
                "message": "Cannot enable cascaded detection: detector not initialized",
                "data": {
                    "enabled": False,
                    "reason": "detector_not_initialized"
                }
            }
        
        return {
            "success": True,
            "message": f"Cascaded detection {'enabled' if enabled else 'disabled'}",
            "data": {
                "enabled": enabled,
                "timestamp": time.time()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to set cascaded detection: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/detection/status")
async def get_detection_status():
    """Get current detection system status."""
    try:
        status = engine.get_detection_status()
        
        return {
            "success": True,
            "data": {
                **status,
                "timestamp": time.time()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get detection status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/separate-results")
async def search_with_separate_results(request: DeepSearchRequest):
    """Perform PII search with results separated by model type."""
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
        
        # Check if cascaded detection is available
        if not (engine.use_cascaded_detection and engine.cascaded_detector.is_initialized):
            raise HTTPException(
                status_code=400, 
                detail="Separate results only available with cascaded detection enabled"
            )
        
        # Perform search with separate results
        logger.info(f"Performing separate results search for {len(request.languages)} languages")
        response = await engine.search_with_separate_results(request)
        
        processing_time = time.time() - start_time
        response.processing_time = processing_time
        
        # Format response for separate results
        return {
            "success": True,
            "data": {
                "stage": response.stage,
                "method": response.method,
                "separate_results": True,
                "model_details": response.model_info.get("detailed_results", {}),
                "summary": {
                    "total_items": len(response.items),
                    "models_used": response.model_info.get("models_used", []),
                    "languages_processed": response.model_info.get("languages_processed", []),
                    "processing_time": processing_time
                },
                "combined_items": [
                    {
                        "id": item.id,
                        "text": item.text,
                        "classification": item.classification.value,
                        "language": item.language,
                        "position": {
                            "start": item.position.start,
                            "end": item.position.end
                        },
                        "probability": item.probability,
                        "confidenceLevel": item.confidence_level.value,
                        "sources": item.sources,
                        "context": item.context
                    }
                    for item in response.items
                ],
                "modelInfo": response.model_info
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Search with separate results failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/compare-models")
async def compare_model_results(request: DeepSearchRequest):
    """Compare PII detection results across all three models."""
    start_time = time.time()
    
    try:
        # Validate request
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")
        
        if not request.languages:
            raise HTTPException(status_code=400, detail="At least one language must be specified")
        
        # Check if cascaded detection is available
        if not (engine.use_cascaded_detection and engine.cascaded_detector.is_initialized):
            raise HTTPException(
                status_code=400, 
                detail="Model comparison only available with cascaded detection enabled"
            )
        
        # Get separate results
        response = await engine.search_with_separate_results(request)
        processing_time = time.time() - start_time
        
        # Extract model comparison data
        comparison_data = {}
        detailed_results = response.model_info.get("detailed_results", {})
        
        for language, lang_data in detailed_results.items():
            comparison_data[language] = {}
            model_results = lang_data.get("model_results", {})
            
            for model_name, model_data in model_results.items():
                if model_data["status"] == "success":
                    results = model_data["results"]
                    comparison_data[language][model_name] = {
                        "count": len(results),
                        "items": [
                            {
                                "text": item.text,
                                "type": item.type,
                                "probability": item.probability,
                                "position": {"start": item.position.start, "end": item.position.end},
                                "confidence_level": item.confidence_level.value
                            }
                            for item in results
                        ],
                        "status": "success"
                    }
                else:
                    comparison_data[language][model_name] = {
                        "count": 0,
                        "items": [],
                        "status": "failed",
                        "error": model_data.get("error", "Unknown error")
                    }
        
        return {
            "success": True,
            "data": {
                "comparison": comparison_data,
                "summary": {
                    "total_processing_time": processing_time,
                    "languages_analyzed": list(detailed_results.keys()),
                    "models_compared": ["multilingual_bert", "deberta_v3", "ollama"],
                    "text_length": len(request.text)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Model comparison failed: {e}")
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