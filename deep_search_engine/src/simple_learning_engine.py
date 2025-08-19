import asyncio
import logging
import pickle
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import numpy as np
import spacy
import re

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
from .ner_segmentation import segment_text_with_ner

logger = logging.getLogger(__name__)

class SimpleLearningEngine:
    """Simple ML Classification engine using scikit-learn for binary PII detection with NER-based noun extraction."""
    
    def __init__(self):
        self.model = None
        self.nlp = None  # spaCy model for NER
        self.is_initialized = False
        self.model_path = "models/active/simple_classifier.pkl"
        self.training_data = []
        self.training_status = {"is_training": False, "progress": 0, "model": None}
        
        # Create models directory if it doesn't exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        self.model_manager = None  # Will be set by the API
    
    async def initialize(self):
        """Initialize the simple learning engine with NER capabilities."""
        try:
            logger.info("Initializing Simple Learning Engine with NER...")
            
            # Load spaCy model for NER
            try:
                self.nlp = spacy.load("en_core_web_sm")
                logger.info("Loaded spaCy English model for NER")
            except OSError:
                logger.warning("spaCy English model not found, downloading...")
                import subprocess
                subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
                self.nlp = spacy.load("en_core_web_sm")
            
            # Try to load existing model
            if os.path.exists(self.model_path):
                await self._load_model()
            else:
                # Create default model with basic training data
                await self._create_default_model()
            
            self.is_initialized = True
            logger.info("Simple Learning Engine initialization completed")
            
        except Exception as e:
            logger.error(f"Failed to initialize simple learning engine: {e}")
            raise
    
    def is_ready(self) -> bool:
        """Check if the engine is ready to process requests."""
        return self.is_initialized and self.model is not None and self.nlp is not None
    
    async def _load_model(self):
        """Load the trained model from disk."""
        try:
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            logger.info("Loaded existing model from disk")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            await self._create_default_model()
    
    async def _save_model(self):
        """Save the trained model to disk."""
        try:
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            logger.info("Model saved to disk")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    async def _create_default_model(self):
        """Create a default model with basic training data."""
        logger.info("Creating default model with basic training data...")
        
        # Basic training data for bootstrapping
        default_training_data = [
            # PII examples
            ("john.doe@example.com", "pii"),
            ("john.smith@gmail.com", "pii"),
            ("contact@company.org", "pii"),
            ("John Doe", "pii"),
            ("Jane Smith", "pii"),
            ("555-123-4567", "pii"),
            ("(555) 987-6543", "pii"),
            ("123 Main Street", "pii"),
            ("New York, NY 10001", "pii"),
            ("4532-1234-5678-9012", "pii"),
            ("123-45-6789", "pii"),
            ("December 15, 1990", "pii"),
            ("01/15/1985", "pii"),
            
            # Non-PII examples
            ("the weather is nice today", "non_pii"),
            ("machine learning is fascinating", "non_pii"),
            ("please review the document", "non_pii"),
            ("the meeting is scheduled", "non_pii"),
            ("artificial intelligence", "non_pii"),
            ("data processing completed", "non_pii"),
            ("system maintenance required", "non_pii"),
            ("backup completed successfully", "non_pii"),
            ("performance metrics improved", "non_pii"),
            ("security updates installed", "non_pii"),
            ("network connectivity restored", "non_pii"),
            ("database optimization finished", "non_pii"),
        ]
        
        # Train initial model
        texts = [item[0] for item in default_training_data]
        labels = [item[1] for item in default_training_data]
        
        self.model = Pipeline([
            ('tfidf', TfidfVectorizer(max_features=1000, ngram_range=(1, 2))),
            ('classifier', LogisticRegression(random_state=42))
        ])
        
        self.model.fit(texts, labels)
        await self._save_model()
        
        logger.info("Default model created and saved")
    
    def is_ready(self) -> bool:
        """Check if the engine is ready to process requests."""
        return self.is_initialized and self.model is not None and self.nlp is not None
    
    async def search(self, request: DeepSearchRequest) -> DeepSearchResponse:
        """Perform binary PII classification on the input text with Stage 1 weight integration."""
        if not self.is_ready():
            raise RuntimeError("Simple Learning Engine not initialized")
        
        logger.info(f"Starting binary classification for text length: {len(request.text)}")
        
        detected_items = []
        
        # Process Stage 1 weights if available
        stage1_weights = self._process_stage1_weights(request.stage1_weights if request.stage1_weights else [])
        
        # Enhanced text segmentation - use word-based approach
        segments = self._segment_text_enhanced(request.text)
        
        for segment in segments:
            if len(segment['text'].strip()) > 0:
                # Apply Stage 1 weights to influence classification
                stage1_weight = self._find_stage1_weight(segment, stage1_weights)
                
                classification_result = await self._classify_segment_with_weights(
                    segment, request.confidence_threshold, stage1_weight
                )
                if classification_result:
                    detected_items.append(classification_result)
        
        response = DeepSearchResponse(
            items=detected_items,
            model_info={
                "primary_model": "simple_learning_classifier",
                "languages_processed": request.languages,
                "method": "sklearn_binary_classification"
            }
        )
        
        logger.info(f"Binary classification completed. Found {len(detected_items)} PII segments")
        return response
    
    def _segment_text(self, text: str) -> List[Dict[str, Any]]:
        """Extract individual words using NER, focusing on nouns and removing verbs/articles."""
        return segment_text_with_ner(self.nlp, text)
    
    def _segment_text_enhanced(self, text: str) -> List[Dict[str, Any]]:
        """Enhanced text segmentation using NER-based word approach."""
        return segment_text_with_ner(self.nlp, text)
    
    
    def _map_ner_to_type(self, ner_type: str) -> str:
        """Map NER entity type to PII type."""
        mapping = {
            'PERSON': 'name',
            'ORG': 'organization',
            'GPE': 'location',
            'LOC': 'location',
            'DATE': 'date'
        }
        return mapping.get(ner_type, 'unknown')
    
    def _process_stage1_weights(self, stage1_weights: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process and normalize Stage 1 weights."""
        processed_weights = []
        
        for weight in stage1_weights:
            if 'text' in weight and 'position' in weight:
                processed_weights.append({
                    'text': weight['text'],
                    'type': weight.get('type', 'unknown'),
                    'start': weight['position']['start'],
                    'end': weight['position']['end'],
                    'weight': weight.get('weight', 1.0),
                    'source': weight.get('source', 'stage1')
                })
        
        logger.info(f"Processed {len(processed_weights)} Stage 1 weights")
        return processed_weights
    
    def _find_stage1_weight(self, segment: Dict[str, Any], stage1_weights: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Find corresponding Stage 1 weight for a segment."""
        segment_start = segment['start']
        segment_end = segment['end']
        segment_text = segment['text'].lower()
        
        for weight in stage1_weights:
            # Check for text overlap or position overlap
            weight_text = weight['text'].lower()
            
            # Exact text match
            if segment_text == weight_text:
                return weight
            
            # Position overlap
            if (segment_start >= weight['start'] and segment_start < weight['end']) or \
               (segment_end > weight['start'] and segment_end <= weight['end']) or \
               (segment_start <= weight['start'] and segment_end >= weight['end']):
                return weight
            
            # Partial text match (for character mode)
            if segment_text in weight_text or weight_text in segment_text:
                return weight
        
        return None
    
    async def _classify_segment_with_weights(self, segment: Dict[str, Any], threshold: float, stage1_weight: Optional[Dict[str, Any]] = None) -> Optional[PIIClassificationResult]:
        """Classify segment with Stage 1 weight influence."""
        try:
            text = segment['text']
            pii_type = segment.get('type', 'unknown')
            pattern_matched = segment.get('pattern_matched', False)
            pos_tag = segment.get('pos', 'UNKNOWN')
            ent_type = segment.get('ent_type', 'NONE')
            
            # Calculate base probability
            base_probability = self._calculate_word_pii_probability(
                text, pii_type, pattern_matched, pos_tag, ent_type
            )
            
            # Apply Stage 1 weight boost
            final_probability = base_probability
            if stage1_weight:
                # Boost probability for items detected in Stage 1
                weight_boost = stage1_weight['weight'] * 0.3  # 30% boost for rule-based matches
                final_probability = min(0.99, base_probability + weight_boost)
                
                # Update PII type if Stage 1 had better type identification
                if stage1_weight['type'] != 'unknown' and pii_type == 'unknown':
                    pii_type = stage1_weight['type']
                
                logger.debug(f"Applied Stage 1 weight: {text} -> {base_probability:.3f} + {weight_boost:.3f} = {final_probability:.3f}")
            
            # Apply additional word-level filters
            if not self._is_valid_pii_word(text, pii_type, pos_tag):
                return None
            
            # Only return if above threshold and classified as PII
            if final_probability >= threshold:
                sources = ["ner_word_analysis"]
                if stage1_weight:
                    sources.append("stage1_weighted")
                
                return PIIClassificationResult(
                    id=f"ner_{segment['start']}_{segment['end']}",
                    text=text,
                    type=pii_type,
                    classification=PIIClassification.PII,
                    language="universal",
                    position=Position(start=segment['start'], end=segment['end']),
                    probability=float(final_probability),
                    confidence_level=self._get_confidence_level(final_probability),
                    context=self._extract_context_for_word(text, segment['start'], segment['end']),
                    sources=sources
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Classification failed for segment: {e}")
            return None
    
    async def _classify_segment(self, segment: Dict[str, Any], threshold: float) -> Optional[PIIClassificationResult]:
        """Classify individual words/tokens as PII or non-PII using enhanced NER-based logic."""
        try:
            text = segment['text']
            pii_type = segment.get('type', 'unknown')
            pattern_matched = segment.get('pattern_matched', False)
            pos_tag = segment.get('pos', 'UNKNOWN')
            ent_type = segment.get('ent_type', 'NONE')
            
            # Enhanced classification logic for individual words
            pii_probability = self._calculate_word_pii_probability(
                text, pii_type, pattern_matched, pos_tag, ent_type
            )
            
            # Apply additional word-level filters
            if not self._is_valid_pii_word(text, pii_type, pos_tag):
                return None
            
            # Only return if above threshold and classified as PII
            if pii_probability >= threshold:
                return PIIClassificationResult(
                    id=f"ner_{segment['start']}_{segment['end']}",
                    text=text,
                    type=pii_type,
                    classification=PIIClassification.PII,
                    language="universal",
                    position=Position(start=segment['start'], end=segment['end']),
                    probability=float(pii_probability),
                    confidence_level=self._get_confidence_level(pii_probability),
                    context=self._extract_context_for_word(text, segment['start'], segment['end']),
                    sources=["ner_word_analysis"]
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Classification failed for segment: {e}")
            return None
    
    def _calculate_word_pii_probability(self, text: str, pii_type: str, pattern_matched: bool, 
                                      pos_tag: str, ent_type: str) -> float:
        """Calculate PII probability for individual words using multiple signals."""
        
        # High confidence for pattern-matched items (emails, phones, etc.)
        if pattern_matched and ent_type == 'PATTERN':
            return 0.98
        
        # High confidence for NER-detected entities
        if pattern_matched and ent_type != 'NONE' and ent_type != 'PATTERN':
            return 0.90
        
        # Use ML model for ambiguous cases
        try:
            probabilities = self.model.predict_proba([text])[0]
            classes = self.model.classes_
            
            pii_index = np.where(classes == 'pii')[0]
            base_probability = probabilities[pii_index[0]] if len(pii_index) > 0 else 0.0
        except:
            base_probability = 0.0
        
        # Apply POS-based adjustments
        pos_multiplier = self._get_pos_multiplier(pos_tag, pii_type)
        adjusted_probability = base_probability * pos_multiplier
        
        # Apply type-specific boosts
        type_boost = self._get_type_boost(text, pii_type)
        final_probability = min(0.99, adjusted_probability + type_boost)
        
        return final_probability
    
    def _get_pos_multiplier(self, pos_tag: str, pii_type: str) -> float:
        """Get multiplier based on POS tag relevance to PII type."""
        multipliers = {
            'PROPN': {  # Proper nouns
                'name': 1.3,
                'organization': 1.2,
                'location': 1.2,
                'unknown': 1.1
            },
            'NOUN': {   # Common nouns
                'address': 1.2,
                'organization': 1.1,
                'location': 1.1,
                'unknown': 1.0
            },
            'NUM': {    # Numbers
                'phone': 1.3,
                'ssn': 1.3,
                'credit_card': 1.3,
                'number': 1.2,
                'unknown': 1.1
            },
            'ENTITY': { # Multi-word entities
                'name': 1.4,
                'organization': 1.3,
                'location': 1.3,
                'date': 1.3,
                'unknown': 1.2
            }
        }
        
        return multipliers.get(pos_tag, {}).get(pii_type, 1.0)
    
    def _get_type_boost(self, text: str, pii_type: str) -> float:
        """Get additional probability boost based on text characteristics."""
        text_lower = text.lower()
        
        # Email patterns
        if pii_type == 'email' and '@' in text:
            return 0.2
        
        # Name patterns (capitalized words)
        if pii_type == 'name' and text[0].isupper() and text[1:].islower():
            return 0.15
        
        # Organization patterns
        if pii_type == 'organization' and any(suffix in text_lower for suffix in 
                                            ['inc', 'llc', 'corp', 'ltd', 'company', 'group']):
            return 0.2
        
        # Phone number patterns
        if pii_type == 'phone' and any(c.isdigit() for c in text):
            digit_ratio = sum(c.isdigit() for c in text) / len(text)
            return min(0.25, digit_ratio * 0.3)
        
        # Location indicators
        if pii_type == 'location' and any(word in text_lower for word in 
                                        ['street', 'ave', 'road', 'drive', 'city']):
            return 0.15
        
        return 0.0
    
    def _is_valid_pii_word(self, text: str, pii_type: str, pos_tag: str) -> bool:
        """Filter out words that are unlikely to be PII despite classification."""
        text_lower = text.lower()
        
        # Filter out very short words (except specific patterns)
        if len(text) < 2 and pii_type not in ['email', 'phone', 'ssn']:
            return False
        
        # Filter out common stop words that might have been missed
        common_non_pii = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 
            'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 
            'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let',
            'put', 'say', 'she', 'too', 'use'
        }
        
        if text_lower in common_non_pii:
            return False
        
        # Filter out single letters (unless they could be initials in names)
        if len(text) == 1 and not (text.isupper() and pii_type == 'name'):
            return False
        
        # Filter out purely numeric strings that are too short for meaningful PII
        if text.isdigit() and len(text) < 3:
            return False
        
        return True
    
    def _extract_context_for_word(self, word: str, start: int, end: int, window: int = 30) -> str:
        """Extract context around detected word with smaller window for individual words."""
        # This is a simplified version since we don't have access to the full text here
        # In a real implementation, you'd pass the full text to this method
        return word  # For now, just return the word itself
    
    def _get_confidence_level(self, score: float) -> ConfidenceLevel:
        """Determine confidence level based on score."""
        if score >= 0.9:
            return ConfidenceLevel.HIGH
        elif score >= 0.7:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW
    
    def _extract_context(self, text: str, start: int, end: int, window: int = 50) -> str:
        """Extract context around detected segment."""
        # For simple implementation, just return the text itself
        return text
    
    async def add_training_data(self, text_segments: List[Dict[str, Any]]):
        """Add new training data and retrain the model."""
        logger.info(f"Adding {len(text_segments)} training samples")
        
        for segment in text_segments:
            self.training_data.append((segment['text'], segment['classification']))
        
        # Retrain if we have enough new data
        if len(text_segments) >= 5:
            await self._retrain_model()
    
    async def _retrain_model(self):
        """Retrain the model with accumulated training data."""
        if not self.training_data:
            return
        
        logger.info(f"Retraining model with {len(self.training_data)} samples")
        
        try:
            texts = [item[0] for item in self.training_data]
            labels = [item[1] for item in self.training_data]
            
            # Retrain the model
            self.model.fit(texts, labels)
            await self._save_model()
            
            # Clear training data after successful retraining
            self.training_data = []
            
            logger.info("Model retraining completed successfully")
            
        except Exception as e:
            logger.error(f"Model retraining failed: {e}")
    
    async def list_models(self) -> List[ModelInfo]:
        """List available models."""
        models = [
            ModelInfo(
                name="simple-learning-classifier",
                version="1.0",
                languages=["universal"],
                accuracy=0.75,  # Estimated accuracy
                f1_score=0.70,  # Estimated F1 score
                last_trained=datetime.now().strftime("%Y-%m-%d")
            )
        ]
        return models
    
    async def train_model(self, request: TrainingRequest):
        """Train or fine-tune the model (placeholder for compatibility)."""
        self.training_status = {
            "is_training": True,
            "progress": 0,
            "model": request.model_name,
            "started_at": datetime.now().isoformat()
        }
        
        try:
            # Simulate training process
            for i in range(101):
                await asyncio.sleep(0.05)  # Faster training for simple model
                self.training_status["progress"] = i
                
                if i % 25 == 0:
                    logger.info(f"Simple model training progress: {i}%")
            
            # Perform actual retraining if we have data
            if self.training_data:
                await self._retrain_model()
            
            self.training_status = {
                "is_training": False,
                "progress": 100,
                "model": request.model_name,
                "completed_at": datetime.now().isoformat(),
                "status": "completed"
            }
            
            logger.info(f"Simple model training completed: {request.model_name}")
            
        except Exception as e:
            self.training_status = {
                "is_training": False,
                "progress": 0,
                "model": request.model_name,
                "error": str(e),
                "status": "failed"
            }
            logger.error(f"Simple model training failed: {e}")
    
    async def get_training_status(self) -> Dict[str, Any]:
        """Get current training status."""
        return self.training_status
    
    async def reload_model(self):
        """Reload the model from the active model path."""
        try:
            logger.info("Reloading model from active path")
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                logger.info("Model reloaded successfully")
            else:
                logger.warning("No active model found, creating new default model")
                await self._create_default_model()
        except Exception as e:
            logger.error(f"Failed to reload model: {e}")
            # Fallback to default model
            await self._create_default_model()
    
    def set_model_manager(self, model_manager):
        """Set the model manager instance."""
        self.model_manager = model_manager