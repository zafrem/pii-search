import os
import logging
from typing import Dict, Any
from .config import config

logger = logging.getLogger(__name__)

class PromptManager:
    def __init__(self):
        self.version = "1.0.0"
        self.prompts = {}
    
    async def initialize(self):
        """Initialize the prompt manager."""
        logger.info("Initializing Prompt Manager...")
        self.prompts = config.prompts
        logger.info(f"Loaded {len(self.prompts)} prompt templates")
    
    def get_context_analysis_prompt(self, text: str, entity: str, type: str, start: int, end: int) -> str:
        """Get context analysis prompt."""
        template = self.prompts.get("context_analysis", self._default_context_prompt())
        return template.format(
            text=text,
            entity=entity,
            type=type,
            start=start,
            end=end
        )
    
    def get_false_positive_prompt(self, text: str, entity: str, type: str) -> str:
        """Get false positive detection prompt."""
        template = self.prompts.get("false_positive_detection", self._default_false_positive_prompt())
        return template.format(
            text=text,
            entity=entity,
            type=type
        )
    
    def get_multilingual_prompt(self, language: str, text: str, entity: str, type: str, start: int, end: int) -> str:
        """Get multilingual context analysis prompt."""
        template = self.prompts.get("multilingual_context", self._default_multilingual_prompt())
        return template.format(
            language=language,
            text=text,
            entity=entity,
            type=type,
            start=start,
            end=end
        )
    
    def _default_context_prompt(self) -> str:
        """Default context analysis prompt."""
        return """Analyze if "{entity}" is genuine personal information in this context:

Text: "{text}"
Entity: "{entity}" (Type: {type})

Is this likely to be real personal information (not fictional, example, or generic text)?

Respond in JSON format:
{{"is_genuine_pii": true, "confidence": 0.8, "reason": "This appears to be a real person's name", "risk_level": "medium"}}"""
    
    def _default_false_positive_prompt(self) -> str:
        """Default false positive detection prompt."""
        return """Determine if this detected entity is a false positive:

Text: "{text}"
Detected: "{entity}" as {type}

Common false positives:
- Movie/book titles, fictional characters
- Company names in non-personal contexts  
- Technical terms, product names
- Example/placeholder text
- Historical references

JSON response: {{"is_false_positive": boolean, "confidence": float, "explanation": string}}"""
    
    def _default_multilingual_prompt(self) -> str:
        """Default multilingual context prompt."""
        return """Analyze this {language} text for genuine PII:

Text: "{text}"
Entity: "{entity}" (Type: {type})

Consider cultural and linguistic context specific to {language}.
Account for naming conventions, address formats, and privacy norms.

JSON response: {{"is_genuine_pii": boolean, "cultural_context": string, "confidence": float}}"""