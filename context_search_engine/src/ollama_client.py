import aiohttp
import asyncio
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from .config import config
from .models import OllamaRequest, OllamaResponse, ModelStatus

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self):
        self.base_url = config.ollama_host
        self.timeout = config.ollama_timeout
        self.max_retries = config.ollama_max_retries
        self.session: Optional[aiohttp.ClientSession] = None
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    async def _make_request(self, endpoint: str, method: str = "GET", data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to Ollama API."""
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(self.max_retries):
            try:
                if not self.session:
                    self.session = aiohttp.ClientSession(
                        timeout=aiohttp.ClientTimeout(total=self.timeout)
                    )
                
                if method == "GET":
                    async with self.session.get(url) as response:
                        response.raise_for_status()
                        return await response.json()
                
                elif method == "POST":
                    async with self.session.post(url, json=data) as response:
                        response.raise_for_status()
                        return await response.json()
                        
            except aiohttp.ClientError as e:
                logger.warning(f"Ollama request failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                if attempt == self.max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception("Max retries exceeded")
    
    async def health_check(self) -> bool:
        """Check if Ollama is running and accessible."""
        try:
            await self._make_request("/api/tags")
            return True
        except Exception as e:
            logger.error(f"Ollama health check failed: {e}")
            return False
    
    async def list_models(self) -> List[ModelStatus]:
        """List available models in Ollama."""
        try:
            response = await self._make_request("/api/tags")
            models = []
            
            for model_data in response.get("models", []):
                model = ModelStatus(
                    name=model_data["name"],
                    status="available",
                    version=model_data.get("digest", "unknown")[:12],
                    size=self._format_size(model_data.get("size", 0)),
                    last_used=model_data.get("modified_at")
                )
                models.append(model)
            
            return models
            
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return []
    
    async def check_model_exists(self, model_name: str) -> bool:
        """Check if a specific model exists in Ollama."""
        models = await self.list_models()
        return any(model.name == model_name for model in models)
    
    async def pull_model(self, model_name: str) -> bool:
        """Pull a model from Ollama registry."""
        try:
            logger.info(f"Pulling model: {model_name}")
            data = {"name": model_name}
            await self._make_request("/api/pull", method="POST", data=data)
            logger.info(f"Successfully pulled model: {model_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to pull model {model_name}: {e}")
            return False
    
    async def generate(self, request: OllamaRequest) -> OllamaResponse:
        """Generate text using Ollama model."""
        try:
            logger.info(f"Starting Ollama generation with model: {request.model}")
            
            # Check if model exists
            if not await self.check_model_exists(request.model):
                logger.warning(f"Model {request.model} not found, attempting to pull...")
                if not await self.pull_model(request.model):
                    raise Exception(f"Failed to pull model: {request.model}")
            
            # Prepare request data
            data = {
                "model": request.model,
                "prompt": request.prompt,
                "stream": request.stream,
                "options": request.options
            }
            
            logger.info(f"Sending request to Ollama: model={request.model}, prompt_length={len(request.prompt)}")
            logger.debug(f"Request data: {json.dumps(data, indent=2)}")
            
            # Make generation request
            response_data = await self._make_request("/api/generate", method="POST", data=data)
            
            logger.info(f"Received response from Ollama: done={response_data.get('done', False)}, response_length={len(response_data.get('response', ''))}")
            logger.debug(f"Full response: {json.dumps(response_data, indent=2)}")
            
            return OllamaResponse(**response_data)
            
        except Exception as e:
            logger.error(f"Ollama generation failed: {type(e).__name__}: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
    
    async def analyze_text(self, text: str, prompt_template: str, model: Optional[str] = None, **kwargs) -> str:
        """Analyze text using a prompt template."""
        try:
            # Use default model if not specified
            if not model:
                model = config.ollama_model
            
            # Check if prompt needs formatting or is already formatted
            try:
                # Try to format - if it fails, assume it's already formatted
                formatted_prompt = prompt_template.format(text=text, **kwargs)
            except (KeyError, ValueError):
                # Prompt is already formatted, use as-is
                formatted_prompt = prompt_template
            
            # Create request
            request = OllamaRequest(
                model=model,
                prompt=formatted_prompt,
                stream=False,
                options={
                    "temperature": 0.1,
                    "top_p": 0.9,
                    "max_tokens": 300
                }
            )
            
            # Generate response
            response = await self.generate(request)
            return response.response.strip()
            
        except Exception as e:
            logger.error(f"Text analysis failed: {e}")
            raise
    
    async def analyze_json(self, text: str, prompt_template: str, model: Optional[str] = None, **kwargs) -> Dict[str, Any]:
        """Analyze text and return JSON response."""
        try:
            response_text = await self.analyze_text(text, prompt_template, model, **kwargs)
            logger.debug(f"Raw LLM response: {response_text}")
            
            # Clean up the response text
            response_text = response_text.strip()
            
            # Try to parse JSON response directly
            try:
                return json.loads(response_text)
            except json.JSONDecodeError as e:
                logger.debug(f"Direct JSON parse failed: {e}")
                
                # Try to extract JSON from response using multiple patterns
                import re
                
                # Pattern 1: Look for JSON object in the response
                json_patterns = [
                    r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',  # Nested JSON
                    r'\{.*?\}',  # Simple JSON
                    r'```json\s*(\{.*?\})\s*```',  # JSON in code blocks
                    r'```\s*(\{.*?\})\s*```'  # JSON in generic code blocks
                ]
                
                for pattern in json_patterns:
                    json_match = re.search(pattern, response_text, re.DOTALL)
                    if json_match:
                        json_text = json_match.group(1) if json_match.groups() else json_match.group()
                        try:
                            return json.loads(json_text)
                        except json.JSONDecodeError:
                            continue
                
                # If all JSON extraction fails, create a default response
                logger.warning(f"Could not parse JSON from LLM response: {response_text}")
                
                # Try to extract meaningful information from the text
                is_genuine = "genuine" in response_text.lower() or "real" in response_text.lower() or "personal" in response_text.lower()
                confidence = 0.5  # Default confidence
                
                # Try to extract confidence if mentioned
                conf_match = re.search(r'confidence[:\s]*([0-9]+(?:\.[0-9]+)?)', response_text, re.IGNORECASE)
                if conf_match:
                    try:
                        confidence = float(conf_match.group(1))
                        if confidence > 1.0:  # Handle percentage format
                            confidence = confidence / 100.0
                    except ValueError:
                        pass
                
                return {
                    "is_genuine_pii": is_genuine,
                    "confidence": confidence,
                    "reason": "Parsed from non-JSON response",
                    "risk_level": "medium",
                    "raw_response": response_text
                }
                    
        except Exception as e:
            logger.error(f"JSON analysis failed: {e}")
            raise
    
    def _format_size(self, size_bytes: int) -> str:
        """Format size in bytes to human readable format."""
        if size_bytes == 0:
            return "Unknown"
        
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        
        return f"{size_bytes:.1f} TB"

# Global client instance
ollama_client = OllamaClient()