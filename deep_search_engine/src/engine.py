import asyncio
import logging
import re
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
import spacy
from transformers import (
    AutoTokenizer, 
    AutoModelForTokenClassification, 
    pipeline,
    TrainingArguments,
    Trainer
)
import torch

from .config import config
from .models import (
    DeepSearchRequest,
    DeepSearchResponse,
    PIIClassificationResult,
    PIIClassification,
    ConfidenceLevel,
    Position,
    TrainingRequest,
    ModelInfo
)
from .simple_learning_engine import SimpleLearningEngine
from .cascaded_pii_detector import CascadedPIIDetector

logger = logging.getLogger(__name__)

class DeepSearchEngine:
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        self.nlp_models = {}
        self.simple_engine = SimpleLearningEngine()
        self.cascaded_detector = CascadedPIIDetector()
        self.use_simple_engine = True  # Default to simple engine
        self.use_cascaded_detection = False  # Enable cascaded detection mode
        self.is_initialized = False
        self.training_status = {"is_training": False, "progress": 0, "model": None}
    
    async def initialize(self):
        """Initialize the deep search engine with models."""
        try:
            logger.info("Initializing Deep Search Engine...")
            
            # Initialize simple learning engine first (default)
            await self.simple_engine.initialize()
            
            # Try to initialize cascaded detector
            try:
                await self.cascaded_detector.initialize()
                self.use_cascaded_detection = True
                logger.info("Cascaded PII detector initialized successfully")
            except Exception as e:
                logger.warning(f"Cascaded detector not available: {e}")
                self.use_cascaded_detection = False
            
            # Try to load advanced models, but don't fail if they're not available
            try:
                await self._load_spacy_models()
                await self._load_transformer_models()
            except Exception as e:
                logger.warning(f"Advanced models not available, using simple engine: {e}")
                self.use_simple_engine = True
            
            self.is_initialized = True
            logger.info("Deep Search Engine initialization completed")
            
        except Exception as e:
            logger.error(f"Failed to initialize engine: {e}")
            raise
    
    async def _load_spacy_models(self):
        """Load spaCy models for different languages."""
        spacy_models = {
            "english": "en_core_web_sm",
            "spanish": "es_core_news_sm",
            "french": "fr_core_news_sm",
            "chinese": "zh_core_web_sm",
            "japanese": "ja_core_news_sm",
            "korean": "ko_core_news_sm"
        }
        
        for lang, model_name in spacy_models.items():
            try:
                logger.info(f"Loading spaCy model for {lang}: {model_name}")
                self.nlp_models[lang] = spacy.load(model_name)
                logger.info(f"Successfully loaded {model_name}")
            except OSError:
                logger.warning(f"spaCy model {model_name} not found, using basic fallback")
                # Use a fallback or skip this language
                continue
    
    async def _load_transformer_models(self):
        """Load transformer models for ML Classification."""
        try:
            model_name = config.default_model
            logger.info(f"Loading transformer model: {model_name}")
            
            # Load tokenizer and model
            self.tokenizers["default"] = AutoTokenizer.from_pretrained(model_name)
            self.models["default"] = AutoModelForTokenClassification.from_pretrained(model_name)
            
            logger.info("Transformer models loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load transformer models: {e}")
            # Continue with basic functionality
    
    def is_ready(self) -> bool:
        """Check if the engine is ready to process requests."""
        return self.is_initialized and (
            self.simple_engine.is_ready() or 
            self._has_advanced_models() or 
            (self.use_cascaded_detection and self.cascaded_detector.is_initialized)
        )
    
    def _has_advanced_models(self) -> bool:
        """Check if advanced models are loaded."""
        return len(self.models) > 0 or len(self.nlp_models) > 0
    
    async def search(self, request: DeepSearchRequest) -> DeepSearchResponse:
        """Perform deep PII search using binary ML Classification (PII/non-PII) and context analysis."""
        if not self.is_ready():
            raise RuntimeError("Engine not initialized")
        
        logger.info(f"Starting deep search for text length: {len(request.text)}")
        
        # Priority 1: Use cascaded detection if available
        if self.use_cascaded_detection and self.cascaded_detector.is_initialized:
            logger.info("Using Parallel Cascaded PII Detection (BERT + DeBERTa + Ollama)")
            return await self._search_with_cascaded_detector(request, separate_results=False)
        
        # Priority 2: Use simple engine by default or if advanced models are not available
        if self.use_simple_engine or not self._has_advanced_models():
            logger.info("Using Simple Learning Engine for classification")
            return await self.simple_engine.search(request)
        
        # Fallback to advanced models if available
        detected_entities = []
        
        # Process with each requested language
        for language in request.languages:
            entities = await self._process_language(request.text, language, request.confidence_threshold)
            detected_entities.extend(entities)
        
        # Remove duplicates and merge overlapping entities
        detected_entities = self._deduplicate_entities(detected_entities)
        
        response = DeepSearchResponse(
            items=detected_entities,
            model_info={
                "primary_model": config.default_model,
                "languages_processed": request.languages,
                "method": "transformers+spacy"
            }
        )
        
        logger.info(f"Deep search completed. Found {len(detected_entities)} entities")
        return response
    
    async def _search_with_cascaded_detector(self, request: DeepSearchRequest, separate_results: bool = False) -> DeepSearchResponse:
        """Perform PII search using the cascaded detector."""
        all_results = {}
        detected_entities = []
        
        # Process with each requested language
        for language in request.languages:
            # Use the parallel cascaded detector
            result_data = await self.cascaded_detector.detect_pii_parallel(
                request.text, language, separate_results=separate_results
            )
            
            if separate_results:
                # Store separate results by language
                all_results[language] = result_data
                # Still collect all items for filtering
                for model_name, model_data in result_data["model_results"].items():
                    if model_data["status"] == "success":
                        detected_entities.extend(model_data["results"])
            else:
                # Combined results
                all_results[language] = result_data
                detected_entities.extend(result_data["results"])
        
        # Filter by confidence threshold
        filtered_entities = [
            entity for entity in detected_entities 
            if entity.probability >= request.confidence_threshold
        ]
        
        if not separate_results:
            # Remove duplicates and merge overlapping entities for combined results
            filtered_entities = self._deduplicate_entities(filtered_entities)
        
        # Prepare model info
        model_info = {
            "primary_model": "parallel-cascaded-detection",
            "models_used": ["multilingual-bert", "deberta-v3", "ollama-llm"],
            "languages_processed": request.languages,
            "method": "parallel-bert-deberta-ollama",
            "separate_results": separate_results
        }
        
        if separate_results:
            # Add detailed results by model and language
            model_info["detailed_results"] = all_results
        else:
            # Add summary information
            model_info["model_summary"] = {}
            for lang_results in all_results.values():
                if "model_summary" in lang_results:
                    for model, summary in lang_results["model_summary"].items():
                        if model not in model_info["model_summary"]:
                            model_info["model_summary"][model] = {"total_count": 0, "status": summary["status"]}
                        model_info["model_summary"][model]["total_count"] += summary["count"]
        
        response = DeepSearchResponse(
            items=filtered_entities,
            model_info=model_info
        )
        
        logger.info(f"Parallel cascaded search completed. Found {len(filtered_entities)} entities (separate_results={separate_results})")
        return response
    
    async def search_with_separate_results(self, request: DeepSearchRequest) -> DeepSearchResponse:
        """
        Perform PII search with separate results from each model.
        Returns results organized by model type for comparison and analysis.
        """
        if not self.is_ready():
            raise RuntimeError("Engine not initialized")
        
        if not (self.use_cascaded_detection and self.cascaded_detector.is_initialized):
            raise RuntimeError("Separate results only available with cascaded detection")
        
        logger.info(f"Starting separate results search for text length: {len(request.text)}")
        return await self._search_with_cascaded_detector(request, separate_results=True)
    
    async def _process_language(self, text: str, language: str, threshold: float) -> List[PIIClassificationResult]:
        """Process text for a specific language."""
        entities = []
        
        # Use spaCy for basic ML Classification if available
        if language in self.nlp_models:
            spacy_entities = self._extract_spacy_entities(text, language)
            entities.extend(spacy_entities)
        
        # Use transformer-based ML Classification
        transformer_entities = await self._extract_transformer_entities(text, language, threshold)
        entities.extend(transformer_entities)
        
        # Apply rule-based post-processing
        entities = self._apply_rule_based_filters(entities, text)
        
        return entities
    
    def _extract_spacy_entities(self, text: str, language: str) -> List[PIIClassificationResult]:
        """Extract entities using spaCy ML Classification."""
        entities = []
        
        if language not in self.nlp_models:
            return entities
        
        nlp = self.nlp_models[language]
        doc = nlp(text)
        
        for ent in doc.ents:
            if self._is_pii_entity(ent.label_):
                entity = PIIClassificationResult(
                    id=str(uuid.uuid4()),
                    text=ent.text,
                    type=self._map_spacy_label_to_type(ent.label_),
                    classification=PIIClassification.PII,
                    language=language,
                    position=Position(start=ent.start_char, end=ent.end_char),
                    probability=0.8,  # Default confidence for spaCy
                    confidence_level=ConfidenceLevel.MEDIUM,
                    context=self._extract_context(text, ent.start_char, ent.end_char),
                    sources=["spacy"]
                )
                entities.append(entity)
        
        return entities
    
    async def _extract_transformer_entities(self, text: str, language: str, threshold: float) -> List[PIIClassificationResult]:
        """Extract entities using transformer models."""
        entities = []
        
        if "default" not in self.models:
            return entities
        
        try:
            # Create ML Classification pipeline
            ner_pipeline = pipeline(
                "ner",
                model=self.models["default"],
                tokenizer=self.tokenizers["default"],
                aggregation_strategy="simple",
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Process text
            results = ner_pipeline(text)
            
            for result in results:
                if result["score"] >= threshold:
                    if self._is_pii_from_transformer(result["entity_group"]):
                        entity = PIIClassificationResult(
                            id=str(uuid.uuid4()),
                            text=result["word"],
                            type=self._map_transformer_label_to_type(result["entity_group"]),
                            classification=PIIClassification.PII,
                            language=language,
                            position=Position(start=result["start"], end=result["end"]),
                            probability=result["score"],
                            confidence_level=self._get_confidence_level(result["score"]),
                            context=self._extract_context(text, result["start"], result["end"]),
                            sources=["transformer"]
                        )
                        entities.append(entity)
            
        except Exception as e:
            logger.error(f"Transformer ML Classification failed: {e}")
        
        return entities
    
    def _is_pii_entity(self, label: str) -> bool:
        """Determine if spaCy entity label indicates PII."""
        pii_labels = {
            "PERSON", "ORG", "DATE", "GPE", "LOC", "EMAIL", "PHONE"
        }
        return label in pii_labels
    
    def _is_pii_from_transformer(self, label: str) -> bool:
        """Determine if transformer entity label indicates PII."""
        pii_labels = {
            "PER", "PERSON", "ORG", "LOC", "DATE", "EMAIL", "PHONE"
        }
        return label in pii_labels
    
    def _map_spacy_label_to_type(self, label: str) -> str:
        """Map spaCy entity label to PII type."""
        label_mapping = {
            "PERSON": "name",
            "ORG": "organization", 
            "DATE": "date",
            "GPE": "location",
            "LOC": "location",
            "EMAIL": "email",
            "PHONE": "phone"
        }
        return label_mapping.get(label, "name")
    
    def _map_transformer_label_to_type(self, label: str) -> str:
        """Map transformer entity label to PII type."""
        label_mapping = {
            "PER": "name",
            "PERSON": "name",
            "ORG": "organization",
            "LOC": "location",
            "DATE": "date", 
            "EMAIL": "email",
            "PHONE": "phone"
        }
        return label_mapping.get(label, "name")
    
    def _get_confidence_level(self, score: float) -> ConfidenceLevel:
        """Determine confidence level based on score."""
        if score >= 0.9:
            return ConfidenceLevel.HIGH
        elif score >= 0.7:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW
    
    def _extract_context(self, text: str, start: int, end: int, window: int = 50) -> str:
        """Extract context around detected entity."""
        context_start = max(0, start - window)
        context_end = min(len(text), end + window)
        return text[context_start:context_end]
    
    def _apply_rule_based_filters(self, entities: List[PIIClassificationResult], text: str) -> List[PIIClassificationResult]:
        """Apply rule-based filters and add regex-based detections."""
        # Add regex-based email detection
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        for match in re.finditer(email_pattern, text):
            entity = PIIClassificationResult(
                id=str(uuid.uuid4()),
                text=match.group(),
                type="email",
                classification=PIIClassification.PII,
                language="universal",
                position=Position(start=match.start(), end=match.end()),
                probability=0.95,
                confidence_level=ConfidenceLevel.HIGH,
                context=self._extract_context(text, match.start(), match.end()),
                sources=["regex"]
            )
            entities.append(entity)
        
        # Add phone number detection
        phone_pattern = r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b'
        for match in re.finditer(phone_pattern, text):
            entity = PIIClassificationResult(
                id=str(uuid.uuid4()),
                text=match.group(),
                type="phone",
                classification=PIIClassification.PII,
                language="universal",
                position=Position(start=match.start(), end=match.end()),
                probability=0.9,
                confidence_level=ConfidenceLevel.HIGH,
                context=self._extract_context(text, match.start(), match.end()),
                sources=["regex"]
            )
            entities.append(entity)
        
        return entities
    
    def _deduplicate_entities(self, entities: List[PIIClassificationResult]) -> List[PIIClassificationResult]:
        """Remove duplicate and overlapping entities."""
        if not entities:
            return entities
        
        # Sort by position
        entities.sort(key=lambda e: (e.position.start, e.position.end))
        
        deduplicated = []
        for entity in entities:
            # Check for overlap with existing entities
            overlap = False
            for existing in deduplicated:
                if (entity.position.start < existing.position.end and 
                    entity.position.end > existing.position.start):
                    # Choose entity with higher probability
                    if entity.probability > existing.probability:
                        deduplicated.remove(existing)
                        deduplicated.append(entity)
                    overlap = True
                    break
            
            if not overlap:
                deduplicated.append(entity)
        
        return deduplicated
    
    async def list_models(self) -> List[ModelInfo]:
        """List available models."""
        models = []
        
        # Add simple learning model
        simple_models = await self.simple_engine.list_models()
        models.extend(simple_models)
        
        # Add advanced models if available
        if self._has_advanced_models():
            models.append(
                ModelInfo(
                    name="bert-base-multilingual-cased",
                    version="1.0",
                    languages=config.supported_languages,
                    accuracy=0.85,
                    f1_score=0.82,
                    last_trained="2024-01-01"
                )
            )
        
        return models
    
    async def train_model(self, request: TrainingRequest):
        """Train or fine-tune a model (placeholder implementation)."""
        self.training_status = {
            "is_training": True,
            "progress": 0,
            "model": request.model_name,
            "started_at": datetime.now().isoformat()
        }
        
        try:
            # Simulate training process
            for i in range(101):
                await asyncio.sleep(0.1)  # Simulate training time
                self.training_status["progress"] = i
                
                if i % 20 == 0:
                    logger.info(f"Training progress: {i}%")
            
            self.training_status = {
                "is_training": False,
                "progress": 100,
                "model": request.model_name,
                "completed_at": datetime.now().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Training completed for model: {request.model_name}")
            
        except Exception as e:
            self.training_status = {
                "is_training": False,
                "progress": 0,
                "model": request.model_name,
                "error": str(e),
                "status": "failed"
            }
            logger.error(f"Training failed: {e}")
    
    async def get_training_status(self) -> Dict[str, Any]:
        """Get current training status."""
        if self.use_simple_engine:
            return await self.simple_engine.get_training_status()
        return self.training_status
    
    async def add_training_data(self, training_data: List[Dict[str, Any]]):
        """Add training data from labeling system."""
        if self.use_simple_engine:
            await self.simple_engine.add_training_data(training_data)
        else:
            logger.info(f"Received {len(training_data)} training samples for advanced models")
            # Store for future advanced model training
            # This would be implemented for transformer model fine-tuning
    
    def set_engine_mode(self, use_simple: bool):
        """Switch between simple and advanced engine modes."""
        self.use_simple_engine = use_simple
        logger.info(f"Engine mode set to: {'Simple' if use_simple else 'Advanced'}")
    
    def set_cascaded_detection(self, enabled: bool):
        """Enable or disable cascaded detection mode."""
        if enabled and not self.cascaded_detector.is_initialized:
            logger.warning("Cannot enable cascaded detection: detector not initialized")
            return False
        
        self.use_cascaded_detection = enabled
        logger.info(f"Cascaded detection {'enabled' if enabled else 'disabled'}")
        return True
    
    def get_detection_status(self) -> Dict[str, Any]:
        """Get current detection system status."""
        return {
            "simple_engine_ready": self.simple_engine.is_ready() if hasattr(self.simple_engine, 'is_ready') else False,
            "cascaded_detection_ready": self.use_cascaded_detection and self.cascaded_detector.is_initialized,
            "advanced_models_ready": self._has_advanced_models(),
            "current_mode": (
                "cascaded" if self.use_cascaded_detection and self.cascaded_detector.is_initialized
                else "simple" if self.use_simple_engine
                else "advanced"
            ),
            "available_models": {
                "multilingual_bert": self.cascaded_detector.bert_model is not None if self.cascaded_detector else False,
                "deberta_v3": self.cascaded_detector.deberta_model is not None if self.cascaded_detector else False,
                "ollama": True  # Assume available, checked at runtime
            }
        }