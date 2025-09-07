import logging
import torch
import os
from typing import Dict, Any, Optional
from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline

logger = logging.getLogger(__name__)

class LocalHuggingFaceClient:
    def __init__(self):
        # Set custom cache directory if specified in environment
        self._set_cache_directory()
        
        # Use a more compatible model for PII detection
        self.model_name = "microsoft/DialoGPT-medium"  # We'll use a different approach
        # Alternative: we'll use a general text classification model and adapt it
        self.fallback_model_name = "cardiffnlp/twitter-roberta-base-sentiment-latest"
        self.model = None
        self.tokenizer = None
        self.classifier = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        pass
    
    def _set_cache_directory(self):
        """Set custom cache directory from environment variables."""
        # Check for custom cache locations in environment
        hf_home = os.getenv('HF_HOME')
        transformers_cache = os.getenv('TRANSFORMERS_CACHE')
        hf_hub_cache = os.getenv('HF_HUB_CACHE')
        
        if hf_home:
            os.environ['HF_HOME'] = hf_home
            logger.info(f"Using custom HF_HOME: {hf_home}")
            
        if transformers_cache:
            os.environ['TRANSFORMERS_CACHE'] = transformers_cache
            logger.info(f"Using custom TRANSFORMERS_CACHE: {transformers_cache}")
            
        if hf_hub_cache:
            os.environ['HF_HUB_CACHE'] = hf_hub_cache
            logger.info(f"Using custom HF_HUB_CACHE: {hf_hub_cache}")
            
        # Create directories if they don't exist
        for cache_dir in [hf_home, transformers_cache, hf_hub_cache]:
            if cache_dir and not os.path.exists(cache_dir):
                try:
                    os.makedirs(cache_dir, exist_ok=True)
                    logger.info(f"Created cache directory: {cache_dir}")
                except Exception as e:
                    logger.warning(f"Failed to create cache directory {cache_dir}: {e}")
    
    def _load_model(self):
        """Load the model locally if not already loaded."""
        if self.classifier is not None:
            return True
            
        try:
            # Try to use a simple sentiment model and adapt it for PII detection
            logger.info(f"Loading local model: {self.fallback_model_name}")
            
            # Use the transformers pipeline for simplicity
            self.classifier = pipeline(
                "sentiment-analysis",
                model=self.fallback_model_name,
                tokenizer=self.fallback_model_name,
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info("Local HuggingFace model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Check if local model is available."""
        try:
            return self._load_model()
        except Exception as e:
            logger.error(f"Local HuggingFace health check failed: {e}")
            return False
    
    async def classify_text(self, text: str, entity_text: str, entity_type: str, **kwargs) -> Dict[str, Any]:
        """Classify text for PII detection using local model."""
        try:
            if not self._load_model():
                raise Exception("Failed to load local model")
            
            logger.info(f"Analyzing with local HuggingFace model: {self.fallback_model_name}")
            
            # For PII detection, we'll analyze the context around the entity
            context = kwargs.get('context', text)
            
            # Create a prompt that helps identify PII vs non-PII
            # We'll use heuristics combined with the sentiment model
            analysis_text = f"This text contains potential personal information: {entity_text}"
            
            # Use the sentiment classifier as a proxy
            result = self.classifier(analysis_text)[0]
            
            # Convert sentiment to PII likelihood
            # If the sentiment is negative, it might indicate concern about privacy (PII)
            # If positive, it might be non-sensitive information
            sentiment_score = result['score']
            sentiment_label = result['label']
            
            # Heuristic-based PII detection combined with model output
            is_genuine_pii = self._heuristic_pii_detection(entity_text, entity_type, context)
            
            # Adjust confidence based on sentiment analysis
            base_confidence = 0.7 if is_genuine_pii else 0.3
            
            # If sentiment suggests negative (concern), increase PII likelihood
            if sentiment_label.lower() in ['negative', 'neg']:
                confidence = min(0.95, base_confidence + (sentiment_score * 0.2))
                is_genuine_pii = True
            else:
                confidence = max(0.1, base_confidence - (sentiment_score * 0.1))
            
            # Determine risk level
            risk_level = self._determine_risk_level(entity_type, confidence)
            
            return {
                "is_genuine_pii": is_genuine_pii,
                "confidence": confidence,
                "reason": f"Local analysis - Entity type: {entity_type}, Sentiment: {sentiment_label}({sentiment_score:.3f}), Heuristic: {is_genuine_pii}",
                "risk_level": risk_level,
                "model": "local_huggingface_hybrid",
                "sentiment_analysis": result
            }
            
        except Exception as e:
            logger.error(f"Local HuggingFace classification failed: {e}")
            # Return conservative default
            return {
                "is_genuine_pii": True,
                "confidence": 0.6,
                "reason": f"Local analysis failed, using heuristics: {str(e)}",
                "risk_level": "medium",
                "model": "local_huggingface_fallback",
                "error": str(e)
            }
    
    def _heuristic_pii_detection(self, entity_text: str, entity_type: str, context: str) -> bool:
        """Use heuristics to detect if entity is likely PII."""
        
        # High confidence PII types
        if entity_type.lower() in ['phone', 'email', 'ssn', 'credit_card']:
            return True
        
        # Check for obvious false positives
        entity_lower = entity_text.lower().strip()
        
        # Common non-PII names/words
        common_false_positives = [
            'john', 'jane', 'smith', 'doe', 'test', 'example', 'sample',
            'user', 'admin', 'root', 'default', 'null', 'none', 'unknown'
        ]
        
        if entity_lower in common_false_positives:
            return False
        
        # Check context for indicators
        context_lower = context.lower()
        
        # False positive indicators in context
        false_positive_indicators = [
            'example', 'sample', 'test', 'demo', 'placeholder',
            'movie', 'book', 'character', 'fictional'
        ]
        
        for indicator in false_positive_indicators:
            if indicator in context_lower:
                return False
        
        # Real PII indicators in context  
        real_pii_indicators = [
            'contact', 'call', 'email', 'address', 'phone',
            'personal', 'private', 'confidential', 'my name is'
        ]
        
        for indicator in real_pii_indicators:
            if indicator in context_lower:
                return True
        
        # Default for names - assume real unless proven otherwise
        if entity_type.lower() == 'name':
            # Short names or single letters are likely false positives
            if len(entity_text.strip()) < 3:
                return False
            return True
        
        return True  # Conservative default
    
    def _determine_risk_level(self, entity_type: str, confidence: float) -> str:
        """Determine risk level based on entity type and confidence."""
        high_risk_types = ["ssn", "credit_card", "id_number", "passport"]
        medium_risk_types = ["email", "phone", "address", "date_of_birth"]
        
        if entity_type.lower() in high_risk_types:
            return "high" if confidence > 0.7 else "medium"
        elif entity_type.lower() in medium_risk_types:
            return "medium" if confidence > 0.6 else "low"
        else:
            return "low" if confidence > 0.8 else "minimal"

# Global client instance
local_huggingface_client = LocalHuggingFaceClient()