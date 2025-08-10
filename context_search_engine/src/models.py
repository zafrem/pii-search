from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
from pydantic import BaseModel, Field

class PIIType(str, Enum):
    PHONE = "phone"
    EMAIL = "email"
    SSN = "ssn"
    CREDIT_CARD = "credit_card"
    NAME = "name"
    ADDRESS = "address"
    ORGANIZATION = "organization"
    DATE = "date"
    ID_NUMBER = "id_number"
    POSTAL_CODE = "postal_code"

class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class AnalysisMode(str, Enum):
    FAST = "fast"
    STANDARD = "standard"
    THOROUGH = "thorough"

class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"

class Position(BaseModel):
    start: int
    end: int

class DetectedEntity(BaseModel):
    id: str
    text: str
    type: PIIType
    language: str
    position: Position
    probability: float
    confidence_level: ConfidenceLevel
    sources: List[str] = []
    context: Optional[str] = None

class ContextAnalysisResult(BaseModel):
    is_genuine_pii: bool
    confidence: float
    reason: str
    risk_level: RiskLevel
    cultural_context: Optional[str] = None
    false_positive_indicators: List[str] = []
    privacy_implications: str = ""

class ContextSearchRequest(BaseModel):
    text: str
    languages: List[str]
    previous_detections: List[DetectedEntity] = []
    analysis_mode: AnalysisMode = AnalysisMode.STANDARD
    confidence_threshold: float = 0.7
    max_characters: Optional[int] = 10000

class ValidateEntityRequest(BaseModel):
    text: str
    entity: DetectedEntity
    context_window: int = 300
    analysis_mode: AnalysisMode = AnalysisMode.STANDARD

class RefinedEntity(BaseModel):
    id: str
    text: str
    type: PIIType
    language: str
    position: Position
    original_probability: float
    refined_probability: float
    confidence_level: ConfidenceLevel
    sources: List[str]
    context: str
    analysis_result: ContextAnalysisResult
    is_validated: bool = True

class ContextSearchResponse(BaseModel):
    stage: int = 3
    method: str = "context_analysis"
    items: List[RefinedEntity] = []
    summary: Dict[str, Any] = {}
    processing_time: float = 0.0
    model_info: Dict[str, str] = {}
    analysis_metadata: Dict[str, Any] = {}
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate summary statistics from refined items."""
        if not self.items:
            return {
                "totalItems": 0,
                "validatedItems": 0,
                "falsePositivesFiltered": 0,
                "highRiskItems": 0,
                "mediumRiskItems": 0,
                "lowRiskItems": 0,
                "averageConfidence": 0.0,
                "languageBreakdown": {},
                "typeBreakdown": {},
                "riskBreakdown": {}
            }
        
        validated_items = [item for item in self.items if item.is_validated]
        false_positives = len(self.items) - len(validated_items)
        
        if validated_items:
            avg_confidence = sum(item.refined_probability for item in validated_items) / len(validated_items)
        else:
            avg_confidence = 0.0
        
        # Risk level breakdown
        risk_breakdown = {}
        for item in validated_items:
            risk = item.analysis_result.risk_level.value
            risk_breakdown[risk] = risk_breakdown.get(risk, 0) + 1
        
        # Language breakdown
        lang_breakdown = {}
        for item in validated_items:
            lang_breakdown[item.language] = lang_breakdown.get(item.language, 0) + 1
        
        # Type breakdown
        type_breakdown = {}
        for item in validated_items:
            type_breakdown[item.type.value] = type_breakdown.get(item.type.value, 0) + 1
        
        return {
            "totalItems": len(validated_items),
            "validatedItems": len(validated_items),
            "falsePositivesFiltered": false_positives,
            "highRiskItems": risk_breakdown.get("high", 0) + risk_breakdown.get("critical", 0),
            "mediumRiskItems": risk_breakdown.get("medium", 0),
            "lowRiskItems": risk_breakdown.get("low", 0) + risk_breakdown.get("minimal", 0),
            "averageConfidence": round(avg_confidence, 3),
            "languageBreakdown": lang_breakdown,
            "typeBreakdown": type_breakdown,
            "riskBreakdown": risk_breakdown
        }

class FalsePositiveCheckRequest(BaseModel):
    text: str
    entity: DetectedEntity
    context_window: int = 200

class FalsePositiveCheckResponse(BaseModel):
    is_false_positive: bool
    confidence: float
    explanation: str
    indicators: List[str] = []

class PrivacyRiskAssessment(BaseModel):
    entity: DetectedEntity
    risk_level: RiskLevel
    risk_score: float  # 0.0 - 1.0
    risk_factors: List[str]
    mitigation_suggestions: List[str]
    compliance_notes: str

class ModelStatus(BaseModel):
    name: str
    status: str  # "available", "loading", "error"
    version: Optional[str] = None
    size: Optional[str] = None
    last_used: Optional[str] = None
    error_message: Optional[str] = None

class HealthStatus(BaseModel):
    status: str  # "healthy", "degraded", "error"
    ollama_connected: bool
    available_models: List[ModelStatus]
    current_model: str
    uptime: float
    total_requests: int
    error_rate: float
    average_latency: float

class OllamaRequest(BaseModel):
    model: str
    prompt: str
    stream: bool = False
    options: Dict[str, Any] = {
        "temperature": 0.1,
        "top_p": 0.9,
        "max_tokens": 200
    }

class OllamaResponse(BaseModel):
    model: str
    response: str
    done: bool
    context: Optional[List[int]] = None
    total_duration: Optional[int] = None
    load_duration: Optional[int] = None
    prompt_eval_count: Optional[int] = None
    eval_count: Optional[int] = None