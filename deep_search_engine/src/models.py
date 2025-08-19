from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class PIIClassification(str, Enum):
    PII = "pii"
    NON_PII = "non_pii"

class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

@dataclass
class Position:
    start: int
    end: int

@dataclass
class PIIClassificationResult:
    id: str
    text: str
    type: str  # PII type (name, email, phone, etc.)
    classification: PIIClassification
    language: str
    position: Position
    probability: float
    confidence_level: ConfidenceLevel
    context: str
    sources: List[str]

@dataclass
class Stage1Weight:
    text: str
    type: str
    position: Position
    weight: float
    source: str

@dataclass
class DeepSearchRequest:
    text: str
    languages: List[str]
    max_characters: Optional[int] = 10000
    confidence_threshold: Optional[float] = 0.7
    stage1_weights: Optional[List[Dict[str, Any]]] = None

@dataclass
class DeepSearchResponse:
    stage: int = 2
    method: str = "deep_learning"
    items: List[PIIClassificationResult] = None
    summary: Dict[str, Any] = None
    processing_time: float = 0.0
    model_info: Dict[str, str] = None
    
    def __post_init__(self):
        if self.items is None:
            self.items = []
        if self.summary is None:
            self.summary = self._generate_summary()
        if self.model_info is None:
            self.model_info = {}
    
    def _generate_summary(self) -> Dict[str, Any]:
        """Generate summary statistics from detected items."""
        if not self.items:
            return {
                "totalItems": 0,
                "detectedItems": 0,
                "highConfidenceItems": 0,
                "mediumConfidenceItems": 0,
                "lowConfidenceItems": 0,
                "averageProbability": 0.0,
                "languageBreakdown": {},
                "classificationBreakdown": {}
            }
        
        high_conf = sum(1 for item in self.items if item.confidence_level == ConfidenceLevel.HIGH)
        medium_conf = sum(1 for item in self.items if item.confidence_level == ConfidenceLevel.MEDIUM)
        low_conf = sum(1 for item in self.items if item.confidence_level == ConfidenceLevel.LOW)
        
        # Count PII items as "detected items"
        detected_items = sum(1 for item in self.items if item.classification == PIIClassification.PII)
        
        avg_prob = sum(item.probability for item in self.items) / len(self.items)
        
        # Language breakdown
        lang_breakdown = {}
        for item in self.items:
            lang_breakdown[item.language] = lang_breakdown.get(item.language, 0) + 1
        
        # Classification breakdown
        classification_breakdown = {}
        for item in self.items:
            classification_breakdown[item.classification.value] = classification_breakdown.get(item.classification.value, 0) + 1
        
        return {
            "totalItems": len(self.items),
            "detectedItems": detected_items,
            "highConfidenceItems": high_conf,
            "mediumConfidenceItems": medium_conf,
            "lowConfidenceItems": low_conf,
            "averageProbability": round(avg_prob, 3),
            "languageBreakdown": lang_breakdown,
            "classificationBreakdown": classification_breakdown
        }

@dataclass
class TrainingRequest:
    dataset_path: str
    model_name: str
    languages: List[str]
    epochs: int = 3
    batch_size: int = 16
    learning_rate: float = 2e-5

@dataclass
class ModelInfo:
    name: str
    version: str
    languages: List[str]
    accuracy: Optional[float] = None
    f1_score: Optional[float] = None
    last_trained: Optional[str] = None
    file_size: Optional[int] = None