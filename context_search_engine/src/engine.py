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
from .huggingface_client import huggingface_client
from .local_huggingface_client import local_huggingface_client
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
            logger.info("Initializing Context Search Engine with dual model support...")
            
            # Check Ollama connectivity
            ollama_available = False
            try:
                async with ollama_client as client:
                    if await client.health_check():
                        ollama_available = True
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
                                    logger.warning("No Ollama models available")
                                    ollama_available = False
                        
                        if ollama_available:
                            logger.info(f"Ollama model ready: {config.ollama_model}")
            except Exception as e:
                logger.warning(f"Ollama initialization failed: {e}")
                ollama_available = False
            
            # Check HuggingFace connectivity (try local first, then API)
            huggingface_available = False
            try:
                # Try local HuggingFace client first
                async with local_huggingface_client as local_hf_client:
                    if await local_hf_client.health_check():
                        huggingface_available = True
                        logger.info("Local HuggingFace model ready")
                    else:
                        # Fall back to API client
                        async with huggingface_client as hf_client:
                            if await hf_client.health_check():
                                huggingface_available = True
                                logger.info(f"HuggingFace API model ready: {hf_client.model_name}")
            except Exception as e:
                logger.warning(f"HuggingFace initialization failed: {e}")
                huggingface_available = False
            
            # At least one model should be available
            if not ollama_available and not huggingface_available:
                raise Exception("Neither Ollama nor HuggingFace models are accessible")
            
            # Store availability status
            self.ollama_available = ollama_available
            self.huggingface_available = huggingface_available
            
            logger.info(f"Available models - Ollama: {ollama_available}, HuggingFace: {huggingface_available}")
            
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
                    "ollama_model": "llama3.2:1b" if self.ollama_available else "N/A",
                    "huggingface_model": "DistilBERT" if self.huggingface_available else "N/A",
                    "ollama_available": str(self.ollama_available),
                    "huggingface_available": str(self.huggingface_available),
                    "analysis_mode": request.analysis_mode.value,
                    "prompt_version": str(self.prompt_manager.version),
                    "dual_model_enabled": str(self.ollama_available and self.huggingface_available)
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
                analysis_result.confidence >= 0.4
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
        """Perform deep context analysis using both Ollama and HuggingFace models."""
        ollama_result = None
        huggingface_result = None
        
        # Run both models in parallel if available
        tasks = []
        
        if self.ollama_available:
            tasks.append(self._analyze_with_ollama(text, entity, context, mode))
        
        if self.huggingface_available:
            tasks.append(self._analyze_with_huggingface(text, entity, context, mode))
        
        if not tasks:
            # Fallback if no models are available
            return ContextAnalysisResult(
                is_genuine_pii=True,  # Conservative default
                confidence=0.5,
                reason="No models available for analysis",
                risk_level=RiskLevel.MEDIUM
            )
        
        try:
            # Run analyses in parallel
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.warning(f"Analysis task {i} failed: {result}")
                    continue
                
                if i == 0 and self.ollama_available:  # First task was Ollama
                    ollama_result = result
                elif (i == 1 and self.ollama_available) or (i == 0 and not self.ollama_available):  # HuggingFace task
                    huggingface_result = result
            
            # Combine results from both models
            return self._combine_analysis_results(ollama_result, huggingface_result, entity)
            
        except Exception as e:
            logger.error(f"Context analysis failed: {e}")
            return ContextAnalysisResult(
                is_genuine_pii=True,  # Conservative default
                confidence=0.5,
                reason=f"Analysis failed: {str(e)}",
                risk_level=RiskLevel.MEDIUM
            )
    
    async def _analyze_with_ollama(self, text: str, entity: DetectedEntity, context: str, mode: AnalysisMode) -> Dict[str, Any]:
        """Perform analysis using Ollama model."""
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
                "context": context,
                "engine": "ollama"
            })
            
            # Analyze with Ollama
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
                "engine": "ollama",
                "response": response
            })
            
            response["model_source"] = "ollama"
            return response
            
        except Exception as e:
            logger.error(f"Ollama analysis failed: {e}")
            raise
    
    async def _analyze_with_huggingface(self, text: str, entity: DetectedEntity, context: str, mode: AnalysisMode) -> Dict[str, Any]:
        """Perform analysis using HuggingFace model (local first, then API)."""
        try:
            # Try local HuggingFace client first
            async with local_huggingface_client as local_hf_client:
                if await local_hf_client.health_check():
                    response = await local_hf_client.classify_text(
                        text=text,
                        entity_text=entity.text,
                        entity_type=entity.type.value,
                        context=context,
                        start=entity.position.start,
                        end=entity.position.end
                    )
                else:
                    # Fall back to API client
                    async with huggingface_client as hf_client:
                        response = await hf_client.classify_text(
                            text=text,
                            entity_text=entity.text,
                            entity_type=entity.type.value,
                            context=context,
                            start=entity.position.start,
                            end=entity.position.end
                        )
            
            # Store response for debugging
            self.debug_info["last_request_responses"].append({
                "entity_id": entity.id,
                "entity_text": entity.text,
                "engine": "huggingface",
                "response": response
            })
            
            response["model_source"] = "huggingface"
            return response
            
        except Exception as e:
            logger.error(f"HuggingFace analysis failed: {e}")
            raise
    
    def _combine_analysis_results(self, ollama_result: Optional[Dict], huggingface_result: Optional[Dict], entity: DetectedEntity) -> ContextAnalysisResult:
        """Combine results from both models into a single analysis result."""
        # Initialize with default values - conservative approach
        combined_is_genuine = True  # Conservative: assume genuine PII unless proven otherwise
        combined_confidence = 0.5  # Moderate confidence when uncertain
        combined_reason = []
        combined_risk_level = "medium"
        
        # Process Ollama result
        if ollama_result:
            ollama_genuine = ollama_result.get("is_genuine_pii", False)
            ollama_confidence = ollama_result.get("confidence", 0.0)
            combined_reason.append(f"Ollama: {ollama_result.get('reason', 'No reason provided')} (confidence: {ollama_confidence:.3f})")
            
            combined_is_genuine = ollama_genuine
            combined_confidence = ollama_confidence
            combined_risk_level = ollama_result.get("risk_level", "medium")
        
        # Process HuggingFace result
        if huggingface_result:
            hf_genuine = huggingface_result.get("is_genuine_pii", False)
            hf_confidence = huggingface_result.get("confidence", 0.0)
            # Get the specific model name that was used
            model_name = huggingface_result.get("model", "HuggingFace")
            combined_reason.append(f"{model_name}: {huggingface_result.get('reason', 'No reason provided')} (confidence: {hf_confidence:.3f})")
            
            if ollama_result:
                # Both models available - combine their decisions
                # Use weighted average favoring the more confident model
                ollama_confidence = ollama_result.get("confidence", 0.0)
                
                if hf_confidence > ollama_confidence:
                    # Trust HuggingFace more
                    combined_is_genuine = hf_genuine
                    combined_confidence = (hf_confidence * 0.7) + (ollama_confidence * 0.3)
                    combined_risk_level = huggingface_result.get("risk_level", "medium")
                else:
                    # Trust Ollama more, but incorporate HuggingFace
                    combined_confidence = (ollama_confidence * 0.7) + (hf_confidence * 0.3)
                
                # If models disagree, be more conservative
                if ollama_result.get("is_genuine_pii", False) != hf_genuine:
                    combined_reason.append("⚠️  Models disagree - using conservative approach")
                    combined_is_genuine = True  # Conservative: assume it's PII if in doubt
                    combined_confidence = min(combined_confidence, 0.7)
                    
            else:
                # Only HuggingFace available - be more conservative
                if hf_genuine or hf_confidence > 0.3:  # Accept if HF thinks it's genuine OR has some confidence
                    combined_is_genuine = True
                    combined_confidence = max(hf_confidence, 0.5)  # Minimum confidence for conservative approach
                else:
                    combined_is_genuine = hf_genuine
                    combined_confidence = hf_confidence
                combined_risk_level = huggingface_result.get("risk_level", "medium")
        
        # Final reason combining both analyses
        final_reason = " | ".join(combined_reason) if combined_reason else "No analysis available"
        
        return ContextAnalysisResult(
            is_genuine_pii=combined_is_genuine,
            confidence=combined_confidence,
            reason=final_reason,
            risk_level=RiskLevel(combined_risk_level),
            cultural_context=ollama_result.get("cultural_context") if ollama_result else None,
            false_positive_indicators=(ollama_result.get("false_positive_indicators", []) if ollama_result else []) + 
                                    (huggingface_result.get("false_positive_indicators", []) if huggingface_result else []),
            privacy_implications=ollama_result.get("privacy_implications", "") if ollama_result else ""
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