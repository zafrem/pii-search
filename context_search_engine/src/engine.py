import asyncio
import logging
import json
import uuid
import time
from typing import List, Dict, Any, Optional
from datetime import datetime

from .config import config
from .models import (
    ContextSearchRequest,
    ContextSearchResponse,
    DetectedEntity,
    RefinedEntity,
    ContextAnalysisResult,
    ValidateEntityRequest,
    FalsePositiveCheckRequest,
    FalsePositiveCheckResponse,
    RiskLevel,
    AnalysisMode,
    PIIType,
    ConfidenceLevel
)
from .ollama_client import ollama_client
from .prompt_manager import PromptManager

logger = logging.getLogger(__name__)

class ContextSearchEngine:
    def __init__(self):
        self.prompt_manager = PromptManager()
        self.is_initialized = False
        self.debug_info = {
            "last_request_prompts": [],
            "last_request_responses": [],
            "last_request_text": "",
            "last_request_entities": []
        }
        self.stats = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "false_positives_filtered": 0,
            "average_latency": 0.0,
            "start_time": time.time()
        }
    
    async def initialize(self):
        """Initialize the context search engine."""
        try:
            logger.info("Initializing Context Search Engine...")
            
            # Check Ollama connectivity
            async with ollama_client as client:
                if not await client.health_check():
                    raise Exception("Ollama is not accessible")
                
                # Check if default model is available
                if not await client.check_model_exists(config.ollama_model):
                    logger.warning(f"Default model {config.ollama_model} not found, attempting to pull...")
                    if not await client.pull_model(config.ollama_model):
                        # If pulling fails, try to use any available model
                        logger.warning(f"Failed to pull default model: {config.ollama_model}")
                        available_models = await client.list_models()
                        if available_models:
                            fallback_model = available_models[0].name
                            logger.info(f"Using fallback model: {fallback_model}")
                            # Update config to use the fallback model
                            config._config["ollama"]["default_model"] = fallback_model
                        else:
                            raise Exception(f"No models available in Ollama and failed to pull default model: {config.ollama_model}")
                
                logger.info(f"Using model: {config.ollama_model}")
            
            # Initialize prompt manager
            await self.prompt_manager.initialize()
            
            self.is_initialized = True
            logger.info("Context Search Engine initialization completed")
            
        except Exception as e:
            logger.error(f"Failed to initialize engine: {e}")
            raise
    
    def is_ready(self) -> bool:
        """Check if the engine is ready to process requests."""
        return self.is_initialized
    
    async def search(self, request: ContextSearchRequest) -> ContextSearchResponse:
        """Perform context-aware PII analysis."""
        if not self.is_ready():
            raise RuntimeError("Engine not initialized")
        
        start_time = time.time()
        self.stats["total_requests"] += 1
        
        # Clear and initialize debug info for this request
        self.debug_info = {
            "last_request_prompts": [],
            "last_request_responses": [],
            "last_request_text": request.text,
            "last_request_entities": [
                {
                    "id": entity.id,
                    "text": entity.text,
                    "type": entity.type.value,
                    "position": {"start": entity.position.start, "end": entity.position.end}
                }
                for entity in request.previous_detections
            ]
        }
        
        try:
            logger.info(f"Starting context search for {len(request.previous_detections)} entities")
            
            refined_entities = []
            
            # Process each detected entity
            for entity in request.previous_detections:
                try:
                    refined_entity = await self._analyze_entity(
                        request.text, 
                        entity, 
                        request.analysis_mode,
                        request.confidence_threshold
                    )
                    
                    if refined_entity.is_validated:
                        refined_entities.append(refined_entity)
                    else:
                        self.stats["false_positives_filtered"] += 1
                        
                except Exception as e:
                    logger.error(f"Failed to analyze entity {entity.id}: {e}")
                    # Continue with other entities
                    continue
            
            processing_time = time.time() - start_time
            self._update_stats(processing_time, success=True)
            
            response = ContextSearchResponse(
                items=refined_entities,
                processing_time=processing_time,
                model_info={
                    "primary_model": config.ollama_model,
                    "analysis_mode": request.analysis_mode.value,
                    "prompt_version": self.prompt_manager.version
                },
                analysis_metadata={
                    "entities_analyzed": len(request.previous_detections),
                    "entities_validated": len(refined_entities),
                    "false_positives_filtered": len(request.previous_detections) - len(refined_entities),
                    "average_confidence": self._calculate_average_confidence(refined_entities)
                }
            )
            
            # Generate summary
            response.summary = response.generate_summary()
            
            logger.info(f"Context search completed. Validated {len(refined_entities)} entities")
            return response
            
        except Exception as e:
            self._update_stats(time.time() - start_time, success=False)
            logger.error(f"Context search failed: {e}")
            raise
    
    async def validate_entity(self, request: ValidateEntityRequest) -> ContextAnalysisResult:
        """Validate a single entity."""
        if not self.is_ready():
            raise RuntimeError("Engine not initialized")
        
        try:
            context = self._extract_context(
                request.text, 
                request.entity.position.start, 
                request.entity.position.end,
                request.context_window
            )
            
            analysis_result = await self._perform_context_analysis(
                request.text,
                request.entity,
                context,
                request.analysis_mode
            )
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Entity validation failed: {e}")
            raise
    
    async def check_false_positive(self, request: FalsePositiveCheckRequest) -> FalsePositiveCheckResponse:
        """Check if an entity is a false positive."""
        try:
            context = self._extract_context(
                request.text,
                request.entity.position.start,
                request.entity.position.end,
                request.context_window
            )
            
            prompt = self.prompt_manager.get_false_positive_prompt(
                text=context,
                entity=request.entity.text,
                type=request.entity.type.value
            )
            
            async with ollama_client as client:
                response = await client.analyze_json(
                    text=context,
                    prompt_template=prompt,
                    model=config.ollama_model,
                    entity=request.entity.text,
                    type=request.entity.type.value
                )
            
            return FalsePositiveCheckResponse(
                is_false_positive=response.get("is_false_positive", False),
                confidence=response.get("confidence", 0.5),
                explanation=response.get("explanation", ""),
                indicators=response.get("indicators", [])
            )
            
        except Exception as e:
            logger.error(f"False positive check failed: {e}")
            raise
    
    async def _analyze_entity(self, text: str, entity: DetectedEntity, mode: AnalysisMode, threshold: float) -> RefinedEntity:
        """Analyze a single entity with context."""
        try:
            # Extract context around the entity
            context = self._extract_context(
                text, 
                entity.position.start, 
                entity.position.end,
                config.context_window_size
            )
            
            # Perform context analysis
            analysis_result = await self._perform_context_analysis(text, entity, context, mode)
            
            # Calculate refined probability
            refined_probability = self._calculate_refined_probability(
                entity.probability, 
                analysis_result.confidence,
                analysis_result.is_genuine_pii
            )
            
            # Determine if entity should be validated
            is_validated = (
                analysis_result.is_genuine_pii and 
                refined_probability >= threshold and
                analysis_result.confidence >= 0.6
            )
            
            return RefinedEntity(
                id=entity.id,
                text=entity.text,
                type=entity.type,
                language=entity.language,
                position=entity.position,
                original_probability=entity.probability,
                refined_probability=refined_probability,
                confidence_level=self._get_confidence_level(refined_probability),
                sources=entity.sources + ["context_analysis"],
                context=context,
                analysis_result=analysis_result,
                is_validated=is_validated
            )
            
        except Exception as e:
            logger.error(f"Entity analysis failed for {entity.id}: {e}")
            raise
    
    async def _perform_context_analysis(self, text: str, entity: DetectedEntity, context: str, mode: AnalysisMode) -> ContextAnalysisResult:
        """Perform deep context analysis using LLM."""
        try:
            # Get appropriate model for language
            model = config.get_model_for_language(entity.language)
            
            # Get analysis mode configuration
            mode_config = config.get_analysis_mode_config(mode.value)
            
            # Get appropriate prompt based on language
            if entity.language in ["chinese", "japanese", "korean"]:
                prompt = self.prompt_manager.get_multilingual_prompt(
                    language=entity.language,
                    text=context,
                    entity=entity.text,
                    type=entity.type.value,
                    start=entity.position.start,
                    end=entity.position.end
                )
            else:
                prompt = self.prompt_manager.get_context_analysis_prompt(
                    text=context,
                    entity=entity.text,
                    type=entity.type.value,
                    start=entity.position.start,
                    end=entity.position.end
                )
            
            # Store prompt for debugging
            self.debug_info["last_request_prompts"].append({
                "entity_id": entity.id,
                "entity_text": entity.text,
                "entity_type": entity.type.value,
                "prompt": prompt,
                "model": model,
                "context": context
            })
            
            # Analyze with LLM
            async with ollama_client as client:
                response = await client.analyze_json(
                    text=context,
                    prompt_template=prompt,
                    model=model,
                    entity=entity.text,
                    type=entity.type.value,
                    start=entity.position.start,
                    end=entity.position.end
                )
                
            # Store response for debugging
            self.debug_info["last_request_responses"].append({
                "entity_id": entity.id,
                "entity_text": entity.text,
                "response": response
            })
            
            # Parse response and create analysis result
            return ContextAnalysisResult(
                is_genuine_pii=response.get("is_genuine_pii", False),
                confidence=response.get("confidence", 0.5),
                reason=response.get("reason", ""),
                risk_level=RiskLevel(response.get("risk_level", "medium")),
                cultural_context=response.get("cultural_context"),
                false_positive_indicators=response.get("false_positive_indicators", []),
                privacy_implications=response.get("privacy_implications", "")
            )
            
        except Exception as e:
            logger.error(f"Context analysis failed: {e}")
            # Return default analysis result
            return ContextAnalysisResult(
                is_genuine_pii=True,  # Conservative default
                confidence=0.5,
                reason="Analysis failed, using conservative default",
                risk_level=RiskLevel.MEDIUM
            )
    
    def _extract_context(self, text: str, start: int, end: int, window: int) -> str:
        """Extract context around detected entity."""
        context_start = max(0, start - window)
        context_end = min(len(text), end + window)
        return text[context_start:context_end]
    
    def _calculate_refined_probability(self, original_prob: float, analysis_confidence: float, is_genuine: bool) -> float:
        """Calculate refined probability based on context analysis."""
        if not is_genuine:
            return 0.0
        
        # Weighted average of original probability and analysis confidence
        refined = (original_prob * 0.4) + (analysis_confidence * 0.6)
        return min(1.0, max(0.0, refined))
    
    def _get_confidence_level(self, probability: float) -> ConfidenceLevel:
        """Determine confidence level based on probability."""
        if probability >= 0.9:
            return ConfidenceLevel.HIGH
        elif probability >= 0.7:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW
    
    def _calculate_average_confidence(self, entities: List[RefinedEntity]) -> float:
        """Calculate average confidence of validated entities."""
        if not entities:
            return 0.0
        
        return sum(entity.refined_probability for entity in entities) / len(entities)
    
    def _update_stats(self, latency: float, success: bool):
        """Update engine statistics."""
        if success:
            self.stats["successful_requests"] += 1
        else:
            self.stats["failed_requests"] += 1
        
        # Update average latency
        total_requests = self.stats["successful_requests"] + self.stats["failed_requests"]
        current_avg = self.stats["average_latency"]
        self.stats["average_latency"] = ((current_avg * (total_requests - 1)) + latency) / total_requests
    
    def get_stats(self) -> Dict[str, Any]:
        """Get engine statistics."""
        uptime = time.time() - self.stats["start_time"]
        error_rate = self.stats["failed_requests"] / max(1, self.stats["total_requests"])
        
        return {
            **self.stats,
            "uptime": uptime,
            "error_rate": error_rate,
            "requests_per_second": self.stats["total_requests"] / max(1, uptime)
        }
    
    def get_debug_info(self) -> Dict[str, Any]:
        """Get debug information about the last request."""
        return {
            "last_request_text": self.debug_info["last_request_text"],
            "last_request_entities_count": len(self.debug_info["last_request_entities"]),
            "last_request_entities": self.debug_info["last_request_entities"],
            "prompts_sent": [
                {
                    "entity_id": prompt["entity_id"],
                    "entity_text": prompt["entity_text"],
                    "entity_type": prompt["entity_type"],
                    "model": prompt["model"],
                    "context": prompt["context"][:200] + "..." if len(prompt["context"]) > 200 else prompt["context"],
                    "full_prompt": prompt["prompt"]
                }
                for prompt in self.debug_info["last_request_prompts"]
            ],
            "responses_received": [
                {
                    "entity_id": resp["entity_id"],
                    "entity_text": resp["entity_text"],
                    "response": resp["response"]
                }
                for resp in self.debug_info["last_request_responses"]
            ]
        }