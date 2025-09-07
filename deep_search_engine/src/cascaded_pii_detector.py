"""
Cascaded PII Detection System

Implements a three-stage PII detection procedure:
1. Multilingual BERT - First line of defense, handles multiple languages
2. DeBERTa v3 - Advanced transformer model for complex text understanding
3. Ollama - LLM-based detection for nuanced and context-dependent PII

The system processes text through each model in order, with early termination
if high-confidence PII is detected, or escalation to more sophisticated models
for uncertain cases.
"""

import logging
import requests
import asyncio
import torch
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from transformers import (
    BertTokenizer, BertForSequenceClassification,
    DebertaV2Tokenizer, DebertaV2ForSequenceClassification,
    pipeline
)

from .models import (
    PIIClassificationResult,
    PIIClassification,
    ConfidenceLevel,
    Position
)

logger = logging.getLogger(__name__)

class CascadedPIIDetector:
    """
    Cascaded PII detection using Multilingual BERT -> DeBERTa v3 -> Ollama
    """
    
    def __init__(self):
        self.bert_tokenizer = None
        self.bert_model = None
        self.deberta_tokenizer = None
        self.deberta_model = None
        self.ollama_url = "http://localhost:11434"
        self.is_initialized = False
        
        # Detection thresholds
        self.bert_high_confidence_threshold = 0.9
        self.bert_medium_confidence_threshold = 0.7
        self.deberta_high_confidence_threshold = 0.85
        self.deberta_medium_confidence_threshold = 0.6
        
    async def initialize(self):
        """Initialize all models in the cascade."""
        try:
            logger.info("Initializing Cascaded PII Detector...")
            
            # Initialize Multilingual BERT
            await self._load_multilingual_bert()
            
            # Initialize DeBERTa v3
            await self._load_deberta_v3()
            
            # Check Ollama availability
            await self._check_ollama()
            
            self.is_initialized = True
            logger.info("Cascaded PII Detector initialization completed")
            
        except Exception as e:
            logger.error(f"Failed to initialize Cascaded PII Detector: {e}")
            raise
    
    async def _load_multilingual_bert(self):
        """Load Multilingual BERT model."""
        try:
            model_path = "models/multilingual-bert"
            logger.info("Loading Multilingual BERT model...")
            
            # Try to load local model first, fallback to online
            try:
                self.bert_tokenizer = BertTokenizer.from_pretrained(model_path)
                self.bert_model = BertForSequenceClassification.from_pretrained(model_path)
                logger.info("Loaded Multilingual BERT from local cache")
            except:
                logger.info("Loading Multilingual BERT from online...")
                self.bert_tokenizer = BertTokenizer.from_pretrained('bert-base-multilingual-cased')
                self.bert_model = BertForSequenceClassification.from_pretrained('bert-base-multilingual-cased')
                
        except Exception as e:
            logger.error(f"Failed to load Multilingual BERT: {e}")
            raise
    
    async def _load_deberta_v3(self):
        """Load DeBERTa v3 model."""
        try:
            model_path = "models/deberta-v3"
            logger.info("Loading DeBERTa v3 model...")
            
            # Try to load local model first, fallback to online
            try:
                self.deberta_tokenizer = DebertaV2Tokenizer.from_pretrained(model_path)
                self.deberta_model = DebertaV2ForSequenceClassification.from_pretrained(model_path)
                logger.info("Loaded DeBERTa v3 from local cache")
            except:
                logger.info("Loading DeBERTa v3 from online...")
                self.deberta_tokenizer = DebertaV2Tokenizer.from_pretrained('microsoft/deberta-v3-base')
                self.deberta_model = DebertaV2ForSequenceClassification.from_pretrained('microsoft/deberta-v3-base')
                
        except Exception as e:
            logger.error(f"Failed to load DeBERTa v3: {e}")
            raise
    
    async def _check_ollama(self):
        """Check if Ollama service is available."""
        try:
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                logger.info("Ollama service is available")
            else:
                logger.warning("Ollama service is not responding correctly")
        except Exception as e:
            logger.warning(f"Ollama service not available: {e}")
    
    async def detect_pii_parallel(self, text: str, language: str = "auto", separate_results: bool = False) -> Dict[str, Any]:
        """
        Parallel PII detection method - runs all three models simultaneously.
        
        Args:
            text: Text to analyze
            language: Language code
            separate_results: If True, returns results from each model separately
        
        Returns:
            Dict containing either combined results or separate results by model
        """
        if not self.is_initialized:
            raise RuntimeError("Cascaded PII Detector not initialized")
        
        logger.info(f"Starting parallel PII detection for text length: {len(text)}")
        
        # Run all three models in parallel
        tasks = []
        task_names = []
        
        # Task 1: Multilingual BERT
        tasks.append(self._detect_with_multilingual_bert(text, language))
        task_names.append("multilingual_bert")
        
        # Task 2: DeBERTa v3
        tasks.append(self._detect_with_deberta_v3(text, language))
        task_names.append("deberta_v3")
        
        # Task 3: Ollama
        tasks.append(self._detect_with_ollama(text, language))
        task_names.append("ollama")
        
        # Execute all tasks concurrently
        logger.info("Running all three models in parallel...")
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        model_results = {}
        all_results = []
        
        for i, (result, model_name) in enumerate(zip(results, task_names)):
            if isinstance(result, Exception):
                logger.error(f"{model_name} failed: {result}")
                model_results[model_name] = {
                    "results": [],
                    "error": str(result),
                    "status": "failed"
                }
            else:
                model_results[model_name] = {
                    "results": result,
                    "error": None,
                    "status": "success",
                    "count": len(result)
                }
                all_results.extend(result)
        
        # Log results summary
        logger.info(f"Parallel detection completed:")
        for model_name, model_data in model_results.items():
            if model_data["status"] == "success":
                logger.info(f"  {model_name}: {model_data['count']} PII items found")
            else:
                logger.info(f"  {model_name}: Failed - {model_data['error']}")
        
        if separate_results:
            return {
                "type": "separate_results",
                "model_results": model_results,
                "total_items": len(all_results),
                "models_used": task_names
            }
        else:
            # Combine and deduplicate results
            combined_results = self._merge_and_deduplicate_results(all_results)
            logger.info(f"Combined results: {len(combined_results)} unique PII items")
            
            return {
                "type": "combined_results",
                "results": combined_results,
                "model_summary": {
                    model_name: {
                        "count": model_data["count"] if model_data["status"] == "success" else 0,
                        "status": model_data["status"]
                    }
                    for model_name, model_data in model_results.items()
                },
                "total_items": len(combined_results),
                "models_used": task_names
            }
    
    async def detect_pii_cascaded(self, text: str, language: str = "auto") -> List[PIIClassificationResult]:
        """
        Legacy cascaded method - kept for backward compatibility.
        Now uses parallel processing but returns combined results in the old format.
        """
        result = await self.detect_pii_parallel(text, language, separate_results=False)
        return result["results"]
    
    async def _detect_with_multilingual_bert(self, text: str, language: str) -> List[PIIClassificationResult]:
        """Stage 1: Multilingual BERT detection."""
        results = []
        
        try:
            # Create classification pipeline
            classifier = pipeline(
                "text-classification",
                model=self.bert_model,
                tokenizer=self.bert_tokenizer,
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Split text into manageable chunks
            chunks = self._split_text_into_chunks(text, max_length=512)
            
            for chunk, start_offset in chunks:
                predictions = classifier(chunk)
                
                # Process predictions (this is a simplified example)
                for pred in predictions if isinstance(predictions, list) else [predictions]:
                    if pred['label'] == 'PII' and pred['score'] > self.bert_medium_confidence_threshold:
                        confidence_level = (ConfidenceLevel.HIGH if pred['score'] > self.bert_high_confidence_threshold 
                                         else ConfidenceLevel.MEDIUM)
                        
                        result = PIIClassificationResult(
                            id=str(uuid.uuid4()),
                            text=chunk,  # This should be more precise in real implementation
                            type="mixed",
                            classification=PIIClassification.PII,
                            language=language,
                            position=Position(start=start_offset, end=start_offset + len(chunk)),
                            probability=pred['score'],
                            confidence_level=confidence_level,
                            context=self._extract_context(text, start_offset, start_offset + len(chunk)),
                            sources=["multilingual-bert"]
                        )
                        results.append(result)
            
        except Exception as e:
            logger.error(f"Multilingual BERT detection failed: {e}")
        
        return results
    
    async def _detect_with_deberta_v3(self, text: str, language: str, offset: int = 0) -> List[PIIClassificationResult]:
        """Stage 2: DeBERTa v3 detection."""
        results = []
        
        try:
            # Create classification pipeline
            classifier = pipeline(
                "text-classification",
                model=self.deberta_model,
                tokenizer=self.deberta_tokenizer,
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Process text with DeBERTa
            predictions = classifier(text)
            
            for pred in predictions if isinstance(predictions, list) else [predictions]:
                if pred['label'] == 'PII' and pred['score'] > self.deberta_medium_confidence_threshold:
                    confidence_level = (ConfidenceLevel.HIGH if pred['score'] > self.deberta_high_confidence_threshold 
                                     else ConfidenceLevel.MEDIUM)
                    
                    result = PIIClassificationResult(
                        id=str(uuid.uuid4()),
                        text=text,  # This should be more precise in real implementation
                        type="mixed",
                        classification=PIIClassification.PII,
                        language=language,
                        position=Position(start=offset, end=offset + len(text)),
                        probability=pred['score'],
                        confidence_level=confidence_level,
                        context=self._extract_context(text, 0, len(text)),
                        sources=["deberta-v3"]
                    )
                    results.append(result)
            
        except Exception as e:
            logger.error(f"DeBERTa v3 detection failed: {e}")
        
        return results
    
    async def _detect_with_ollama(self, text: str, language: str, offset: int = 0) -> List[PIIClassificationResult]:
        """Stage 3: Ollama LLM-based detection."""
        results = []
        
        try:
            # Prepare prompt for PII detection
            prompt = f"""
            Analyze the following text and identify any Personal Identifiable Information (PII). 
            Look for names, email addresses, phone numbers, addresses, social security numbers, 
            credit card numbers, and any other sensitive personal information.
            
            Text to analyze: "{text}"
            
            Respond with JSON format:
            {{
                "has_pii": true/false,
                "pii_items": [
                    {{
                        "text": "detected PII text",
                        "type": "name|email|phone|address|ssn|credit_card|other",
                        "confidence": 0.0-1.0,
                        "start_pos": start_position,
                        "end_pos": end_position
                    }}
                ]
            }}
            """
            
            # Make request to Ollama
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": "llama3.2:3b",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json"
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ollama_result = response.json()
                
                # Parse Ollama response
                try:
                    import json
                    pii_analysis = json.loads(ollama_result.get('response', '{}'))
                    
                    if pii_analysis.get('has_pii', False):
                        for item in pii_analysis.get('pii_items', []):
                            confidence = item.get('confidence', 0.5)
                            confidence_level = (ConfidenceLevel.HIGH if confidence > 0.8 else 
                                             ConfidenceLevel.MEDIUM if confidence > 0.6 else 
                                             ConfidenceLevel.LOW)
                            
                            result = PIIClassificationResult(
                                id=str(uuid.uuid4()),
                                text=item.get('text', ''),
                                type=item.get('type', 'unknown'),
                                classification=PIIClassification.PII,
                                language=language,
                                position=Position(
                                    start=offset + item.get('start_pos', 0),
                                    end=offset + item.get('end_pos', len(item.get('text', '')))
                                ),
                                probability=confidence,
                                confidence_level=confidence_level,
                                context=self._extract_context(text, 
                                                           item.get('start_pos', 0), 
                                                           item.get('end_pos', len(item.get('text', '')))),
                                sources=["ollama-llm"]
                            )
                            results.append(result)
                
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse Ollama JSON response: {e}")
            
        except Exception as e:
            logger.error(f"Ollama detection failed: {e}")
        
        return results
    
    def _split_text_into_chunks(self, text: str, max_length: int = 512) -> List[Tuple[str, int]]:
        """Split text into chunks suitable for transformer models."""
        chunks = []
        start = 0
        
        while start < len(text):
            end = min(start + max_length, len(text))
            
            # Try to break at sentence boundaries
            if end < len(text):
                # Look for sentence ending within last 100 chars
                for i in range(end - 100, end):
                    if i > start and text[i] in '.!?':
                        end = i + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append((chunk, start))
            
            start = end
        
        return chunks
    
    def _extract_uncertain_segments(self, text: str, bert_results: List[PIIClassificationResult]) -> List[Tuple[str, int]]:
        """Extract text segments that need further analysis."""
        # This is a simplified implementation
        # In practice, you'd extract segments where BERT had medium/low confidence
        # or areas between detected PII that might contain additional information
        
        uncertain_segments = []
        last_end = 0
        
        for result in sorted(bert_results, key=lambda x: x.position.start):
            if result.confidence_level != ConfidenceLevel.HIGH:
                # Include some context around uncertain detections
                start = max(0, result.position.start - 50)
                end = min(len(text), result.position.end + 50)
                segment_text = text[start:end]
                uncertain_segments.append((segment_text, start))
        
        # If no uncertain segments, return the full text
        if not uncertain_segments:
            uncertain_segments.append((text, 0))
        
        return uncertain_segments
    
    def _extract_context(self, text: str, start: int, end: int, window: int = 50) -> str:
        """Extract context around detected entity."""
        context_start = max(0, start - window)
        context_end = min(len(text), end + window)
        return text[context_start:context_end]
    
    def _merge_and_deduplicate_results(self, results: List[PIIClassificationResult]) -> List[PIIClassificationResult]:
        """Merge and deduplicate detection results from all stages."""
        if not results:
            return results
        
        # Sort by position
        results.sort(key=lambda r: (r.position.start, r.position.end))
        
        merged = []
        for result in results:
            # Check for overlap with existing results
            overlapped = False
            for i, existing in enumerate(merged):
                if (result.position.start < existing.position.end and 
                    result.position.end > existing.position.start):
                    
                    # Merge overlapping results, keeping higher confidence
                    if result.probability > existing.probability:
                        # Replace with higher confidence result
                        merged[i] = result
                        # Merge sources
                        merged[i].sources = list(set(existing.sources + result.sources))
                    else:
                        # Keep existing but merge sources
                        existing.sources = list(set(existing.sources + result.sources))
                    
                    overlapped = True
                    break
            
            if not overlapped:
                merged.append(result)
        
        return merged