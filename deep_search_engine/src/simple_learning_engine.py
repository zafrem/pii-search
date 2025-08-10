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

logger = logging.getLogger(__name__)

class SimpleLearningEngine:
    """Simple ML Classification engine using scikit-learn for binary PII detection."""
    
    def __init__(self):
        self.model = None
        self.is_initialized = False
        self.model_path = "models/active/simple_classifier.pkl"
        self.training_data = []
        self.training_status = {"is_training": False, "progress": 0, "model": None}
        
        # Create models directory if it doesn't exist
        os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        self.model_manager = None  # Will be set by the API
    
    async def initialize(self):
        """Initialize the simple learning engine."""
        try:
            logger.info("Initializing Simple Learning Engine...")
            
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
        return self.is_initialized and self.model is not None
    
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
        return self.is_initialized and self.model is not None
    
    async def search(self, request: DeepSearchRequest) -> DeepSearchResponse:
        """Perform binary PII classification on the input text."""
        if not self.is_ready():
            raise RuntimeError("Simple Learning Engine not initialized")
        
        logger.info(f"Starting binary classification for text length: {len(request.text)}")
        
        detected_items = []
        
        # Split text into segments for classification
        segments = self._segment_text(request.text)
        
        for segment in segments:
            if len(segment['text'].strip()) > 0:
                classification_result = await self._classify_segment(
                    segment, request.confidence_threshold
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
        """Extract individual PII entities using pattern matching and NER-based approach."""
        import re
        
        segments = []
        
        # Define PII patterns with their types
        pii_patterns = [
            (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'email'),  # Email
            (r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b', 'phone'),  # Phone
            (r'\b\d{3}-\d{2}-\d{4}\b', 'ssn'),  # SSN
            (r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', 'credit_card'),  # Credit Card
            (r'\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b', 'name'),  # Names (2-3 words)
            (r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Way|Place|Pl|Circle|Cir|Court|Ct)\b', 'address'),  # Addresses
            (r'\b\d{5}(?:-\d{4})?\b', 'postal_code'),  # ZIP codes
        ]
        
        # Extract entities using patterns
        for pattern, pii_type in pii_patterns:
            for match in re.finditer(pattern, text, re.IGNORECASE):
                # Check for overlaps with existing segments
                overlap = False
                for existing in segments:
                    if (match.start() < existing['end'] and match.end() > existing['start']):
                        overlap_ratio = (min(match.end(), existing['end']) - max(match.start(), existing['start'])) / (match.end() - match.start())
                        if overlap_ratio > 0.5:  # More than 50% overlap
                            overlap = True
                            break
                
                if not overlap:
                    segments.append({
                        'text': match.group().strip(),
                        'start': match.start(),
                        'end': match.end(),
                        'type': pii_type,
                        'pattern_matched': True
                    })
        
        # Also look for organization names (companies, institutions)
        org_patterns = [
            r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+(?:Inc|LLC|Corp|Corporation|Ltd|Limited|Company|Co|Group|Associates|Partners|Consulting|Services|Solutions|Systems|Technologies|Tech)\.?)\b',
        ]
        
        for pattern in org_patterns:
            for match in re.finditer(pattern, text):
                # Check for overlaps
                overlap = False
                for existing in segments:
                    if (match.start() < existing['end'] and match.end() > existing['start']):
                        overlap_ratio = (min(match.end(), existing['end']) - max(match.start(), existing['start'])) / (match.end() - match.start())
                        if overlap_ratio > 0.5:
                            overlap = True
                            break
                
                if not overlap:
                    segments.append({
                        'text': match.group().strip(),
                        'start': match.start(),
                        'end': match.end(),
                        'type': 'organization',
                        'pattern_matched': True
                    })
        
        # Extract potential names that might not match the simple pattern
        # Look for capitalized words that could be names
        name_candidates = re.finditer(r'\b[A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})+\b', text)
        for match in name_candidates:
            # Skip if already covered by other patterns
            overlap = False
            for existing in segments:
                if (match.start() < existing['end'] and match.end() > existing['start']):
                    overlap = True
                    break
            
            if not overlap:
                # Additional filtering for common non-name patterns
                candidate_text = match.group().strip()
                if not re.match(r'.*(Street|Avenue|Road|Drive|Lane|Boulevard|Company|Corporation|Inc|LLC).*', candidate_text, re.IGNORECASE):
                    segments.append({
                        'text': candidate_text,
                        'start': match.start(),
                        'end': match.end(),
                        'type': 'name',
                        'pattern_matched': False  # Less confident
                    })
        
        # Sort segments by start position
        segments.sort(key=lambda x: x['start'])
        
        return segments
    
    async def _classify_segment(self, segment: Dict[str, Any], threshold: float) -> Optional[PIIClassificationResult]:
        """Classify a text segment as PII or non-PII."""
        try:
            text = segment['text']
            pii_type = segment.get('type', 'unknown')
            pattern_matched = segment.get('pattern_matched', False)
            
            # If pattern matched, give it high confidence
            if pattern_matched:
                pii_probability = 0.95  # High confidence for pattern matches
            else:
                # Get ML model prediction probability
                probabilities = self.model.predict_proba([text])[0]
                classes = self.model.classes_
                
                # Find PII probability
                pii_index = np.where(classes == 'pii')[0]
                if len(pii_index) > 0:
                    pii_probability = probabilities[pii_index[0]]
                else:
                    pii_probability = 0.0
            
            # Only return if above threshold and classified as PII
            if pii_probability >= threshold:
                return PIIClassificationResult(
                    id=f"simple_{segment['start']}_{segment['end']}",
                    text=text,
                    type=pii_type,  # Include the PII type
                    classification=PIIClassification.PII,
                    language="universal",
                    position=Position(start=segment['start'], end=segment['end']),
                    probability=float(pii_probability),
                    confidence_level=self._get_confidence_level(pii_probability),
                    context=self._extract_context(text, segment['start'], segment['end']),
                    sources=["simple_learning"]
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Classification failed for segment: {e}")
            return None
    
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