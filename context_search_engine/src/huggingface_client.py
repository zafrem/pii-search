import asyncio
import logging
import json
import aiohttp
import os
from typing import Dict, Any, Optional, List
from datetime import datetime

from .config import config

logger = logging.getLogger(__name__)

class HuggingFaceClient:
    def __init__(self):
        self.api_url = "https://api-inference.huggingface.co/models"
        self.model_name = "iiiorg/piiranha-v1-detect-personal-information"
        self.api_token = os.getenv("HUGGINGFACE_API_TOKEN")  # Optional: for higher rate limits
        self.timeout = 30
        self.max_retries = 3
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry."""
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_token:
            headers["Authorization"] = f"Bearer {self.api_token}"
            
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout),
            headers=headers
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    async def _make_request(self, text: str, **kwargs) -> Dict[str, Any]:
        """Make request to Hugging Face Inference API."""
        url = f"{self.api_url}/{self.model_name}"
        
        # Prepare the payload for text classification
        payload = {
            "inputs": text,
            "parameters": {
                "return_all_scores": True
            }
        }
        
        for attempt in range(self.max_retries):
            try:
                if not self.session:
                    await self.__aenter__()
                
                logger.debug(f"Making request to HuggingFace API (attempt {attempt + 1})")
                async with self.session.post(url, json=payload) as response:
                    if response.status == 503:
                        # Model is loading, wait and retry
                        logger.info("Model is loading, waiting 10 seconds...")
                        await asyncio.sleep(10)
                        continue
                    
                    response.raise_for_status()
                    result = await response.json()
                    logger.debug(f"HuggingFace API response: {result}")
                    return result
                        
            except aiohttp.ClientError as e:
                logger.warning(f"HuggingFace request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception("Max retries exceeded")
    
    async def health_check(self) -> bool:
        """Check if HuggingFace API is accessible."""
        try:
            # Test with a small sample text
            await self._make_request("test")
            return True
        except Exception as e:
            logger.error(f"HuggingFace health check failed: {e}")
            return False
    
    async def classify_text(self, text: str, entity_text: str, entity_type: str, **kwargs) -> Dict[str, Any]:
        """Classify text for PII detection using DistilBERT model."""
        try:
            logger.info(f"Analyzing with HuggingFace DistilBERT model: {self.model_name}")
            
            # For PII detection, we'll analyze the context around the entity
            context = kwargs.get('context', text)
            
            # Make request to HuggingFace
            response = await self._make_request(context)
            
            # Parse response - DistilBERT typically returns classification scores
            if isinstance(response, list) and len(response) > 0:
                # Handle the response format from piiranha model
                scores = response[0] if isinstance(response[0], list) else response
                
                # Find PII-related scores
                pii_score = 0.0
                non_pii_score = 0.0
                
                for item in scores:
                    label = item.get('label', '').lower()
                    score = item.get('score', 0.0)
                    
                    if 'pii' in label or 'personal' in label or 'sensitive' in label:
                        pii_score = max(pii_score, score)
                    elif 'not' in label or 'safe' in label or 'non' in label:
                        non_pii_score = max(non_pii_score, score)
                
                # Determine if it's genuine PII
                is_genuine_pii = pii_score > non_pii_score and pii_score > 0.5
                confidence = max(pii_score, non_pii_score)
                
                # Determine risk level based on entity type and confidence
                risk_level = self._determine_risk_level(entity_type, confidence)
                
                return {
                    "is_genuine_pii": is_genuine_pii,
                    "confidence": confidence,
                    "reason": f"DistilBERT classification - PII score: {pii_score:.3f}, Non-PII score: {non_pii_score:.3f}",
                    "risk_level": risk_level,
                    "model": "huggingface_distilbert",
                    "raw_scores": scores,
                    "pii_score": pii_score,
                    "non_pii_score": non_pii_score
                }
            else:
                # Fallback if response format is unexpected
                logger.warning(f"Unexpected response format from HuggingFace: {response}")
                return {
                    "is_genuine_pii": False,
                    "confidence": 0.5,
                    "reason": "Unexpected response format from DistilBERT model",
                    "risk_level": "medium",
                    "model": "huggingface_distilbert",
                    "raw_response": response
                }
            
        except Exception as e:
            logger.error(f"HuggingFace classification failed: {e}")
            # Return conservative default
            return {
                "is_genuine_pii": True,
                "confidence": 0.5,
                "reason": f"HuggingFace analysis failed: {str(e)}",
                "risk_level": "medium",
                "model": "huggingface_distilbert",
                "error": str(e)
            }
    
    def _determine_risk_level(self, entity_type: str, confidence: float) -> str:
        """Determine risk level based on entity type and confidence."""
        high_risk_types = ["ssn", "credit_card", "id_number", "passport"]
        medium_risk_types = ["email", "phone", "address", "date_of_birth"]
        
        if entity_type.lower() in high_risk_types:
            return "high" if confidence > 0.7 else "medium"
        elif entity_type.lower() in medium_risk_types:
            return "medium" if confidence > 0.6 else "low"
        else:
            return "low" if confidence > 0.8 else "very_low"

# Global client instance
huggingface_client = HuggingFaceClient()