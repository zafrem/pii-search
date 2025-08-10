import pytest
from pydantic import ValidationError

from src.models import (
    PIIType, ConfidenceLevel, AnalysisMode, RiskLevel,
    Position, DetectedEntity, ContextAnalysisResult,
    ContextSearchRequest, ContextSearchResponse,
    RefinedEntity, ValidateEntityRequest,
    FalsePositiveCheckRequest, FalsePositiveCheckResponse
)


class TestEnums:
    """Test enum values and validity."""
    
    def test_pii_types(self):
        """Test PII type enumeration."""
        assert PIIType.EMAIL == "email"
        assert PIIType.PHONE == "phone"
        assert PIIType.SSN == "ssn"
        assert PIIType.NAME == "name"
    
    def test_confidence_levels(self):
        """Test confidence level enumeration."""
        assert ConfidenceLevel.HIGH == "high"
        assert ConfidenceLevel.MEDIUM == "medium" 
        assert ConfidenceLevel.LOW == "low"
    
    def test_analysis_modes(self):
        """Test analysis mode enumeration."""
        assert AnalysisMode.FAST == "fast"
        assert AnalysisMode.STANDARD == "standard"
        assert AnalysisMode.THOROUGH == "thorough"
    
    def test_risk_levels(self):
        """Test risk level enumeration."""
        assert RiskLevel.CRITICAL == "critical"
        assert RiskLevel.HIGH == "high"
        assert RiskLevel.MEDIUM == "medium"
        assert RiskLevel.LOW == "low"
        assert RiskLevel.MINIMAL == "minimal"


class TestPosition:
    """Test Position model."""
    
    def test_valid_position(self):
        """Test valid position creation."""
        pos = Position(start=0, end=10)
        assert pos.start == 0
        assert pos.end == 10
    
    def test_position_validation(self):
        """Test position validation."""
        with pytest.raises(ValidationError):
            Position(start="invalid", end=10)


class TestDetectedEntity:
    """Test DetectedEntity model."""
    
    def test_valid_entity(self):
        """Test valid entity creation."""
        entity = DetectedEntity(
            id="test-123",
            text="john@example.com",
            type=PIIType.EMAIL,
            language="english",
            position=Position(start=0, end=15),
            probability=0.95,
            confidence_level=ConfidenceLevel.HIGH
        )
        assert entity.id == "test-123"
        assert entity.type == PIIType.EMAIL
        assert entity.probability == 0.95
        assert entity.sources == []
        assert entity.context is None
    
    def test_entity_with_context(self):
        """Test entity with context."""
        entity = DetectedEntity(
            id="test-456",
            text="John Doe",
            type=PIIType.NAME,
            language="english", 
            position=Position(start=0, end=8),
            probability=0.85,
            confidence_level=ConfidenceLevel.MEDIUM,
            context="Hello, my name is John Doe"
        )
        assert entity.context == "Hello, my name is John Doe"
    
    def test_entity_validation(self):
        """Test entity field validation."""
        with pytest.raises(ValidationError):
            DetectedEntity(
                id="test",
                text="test",
                type="invalid_type",  # Invalid enum value
                language="english",
                position=Position(start=0, end=4),
                probability=0.8,
                confidence_level=ConfidenceLevel.HIGH
            )


class TestContextSearchRequest:
    """Test ContextSearchRequest model."""
    
    def test_valid_request(self):
        """Test valid request creation."""
        request = ContextSearchRequest(
            text="Hello, my email is john@example.com",
            languages=["english"],
            mode=AnalysisMode.STANDARD
        )
        assert request.text == "Hello, my email is john@example.com"
        assert request.languages == ["english"]
        assert request.mode == AnalysisMode.STANDARD
        assert request.confidence_threshold == 0.7  # Default value
    
    def test_request_with_custom_threshold(self):
        """Test request with custom confidence threshold."""
        request = ContextSearchRequest(
            text="Test text",
            languages=["english"],
            confidence_threshold=0.9
        )
        assert request.confidence_threshold == 0.9
    
    def test_request_validation(self):
        """Test request validation."""
        with pytest.raises(ValidationError):
            ContextSearchRequest(
                text="",  # Empty text should fail
                languages=["english"]
            )


class TestContextSearchResponse:
    """Test ContextSearchResponse model."""
    
    def test_valid_response(self):
        """Test valid response creation."""
        entity = DetectedEntity(
            id="test-1",
            text="test@example.com",
            type=PIIType.EMAIL,
            language="english",
            position=Position(start=0, end=16),
            probability=0.95,
            confidence_level=ConfidenceLevel.HIGH
        )
        
        response = ContextSearchResponse(
            request_id="req-123",
            stage=3,
            method="context_analysis",
            items=[entity],
            total_items=1,
            summary={"emails": 1}
        )
        
        assert response.request_id == "req-123"
        assert response.stage == 3
        assert response.total_items == 1
        assert len(response.items) == 1
        assert response.summary["emails"] == 1


class TestValidateEntityRequest:
    """Test ValidateEntityRequest model."""
    
    def test_valid_validation_request(self):
        """Test valid validation request."""
        request = ValidateEntityRequest(
            entity_id="entity-123",
            text="john@example.com",
            context="Contact me at john@example.com"
        )
        assert request.entity_id == "entity-123"
        assert request.text == "john@example.com"
        assert request.context == "Contact me at john@example.com"


class TestFalsePositiveCheck:
    """Test false positive check models."""
    
    def test_false_positive_request(self):
        """Test false positive check request."""
        request = FalsePositiveCheckRequest(
            text="john@example.com",
            context="Email: john@example.com",
            detected_type=PIIType.EMAIL
        )
        assert request.text == "john@example.com"
        assert request.detected_type == PIIType.EMAIL
    
    def test_false_positive_response(self):
        """Test false positive check response."""
        response = FalsePositiveCheckResponse(
            is_false_positive=False,
            confidence=0.92,
            reasoning="Clear email pattern with valid domain"
        )
        assert response.is_false_positive is False
        assert response.confidence == 0.92
        assert "valid domain" in response.reasoning