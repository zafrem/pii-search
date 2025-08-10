import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

from src.engine import ContextSearchEngine
from src.models import (
    ContextSearchRequest, ContextSearchResponse, DetectedEntity,
    PIIType, ConfidenceLevel, AnalysisMode, RiskLevel, Position
)


@pytest.fixture
def engine():
    """Create a ContextSearchEngine instance."""
    return ContextSearchEngine()


@pytest.fixture
def sample_request():
    """Create a sample search request."""
    return ContextSearchRequest(
        text="Hello, my name is John Doe and my email is john@example.com",
        languages=["english"],
        mode=AnalysisMode.STANDARD,
        confidence_threshold=0.7
    )


@pytest.fixture
def sample_entity():
    """Create a sample detected entity."""
    return DetectedEntity(
        id=str(uuid.uuid4()),
        text="john@example.com",
        type=PIIType.EMAIL,
        language="english",
        position=Position(start=46, end=62),
        probability=0.95,
        confidence_level=ConfidenceLevel.HIGH,
        context="my email is john@example.com"
    )


class TestEngineInitialization:
    """Test engine initialization and setup."""
    
    def test_engine_creation(self, engine):
        """Test engine can be created."""
        assert isinstance(engine, ContextSearchEngine)
        assert engine.config is not None
    
    @pytest.mark.asyncio
    async def test_initialize_engine(self, engine):
        """Test engine initialization."""
        with patch.object(engine, '_setup_ollama_connection') as mock_setup:
            mock_setup.return_value = True
            
            await engine.initialize()
            assert engine.is_initialized == True
            mock_setup.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_initialize_failure(self, engine):
        """Test engine initialization failure."""
        with patch.object(engine, '_setup_ollama_connection') as mock_setup:
            mock_setup.side_effect = Exception("Connection failed")
            
            with pytest.raises(Exception):
                await engine.initialize()


class TestSearchFunctionality:
    """Test core search functionality."""
    
    @pytest.mark.asyncio
    async def test_search_uninitialized_engine(self, engine, sample_request):
        """Test search with uninitialized engine."""
        with pytest.raises(RuntimeError, match="Engine not initialized"):
            await engine.search(sample_request)
    
    @pytest.mark.asyncio
    async def test_search_basic_functionality(self, engine, sample_request):
        """Test basic search functionality."""
        engine.is_initialized = True
        
        with patch.object(engine, '_process_entities_with_context') as mock_process:
            mock_entities = [DetectedEntity(
                id="test-1",
                text="john@example.com",
                type=PIIType.EMAIL,
                language="english",
                position=Position(start=46, end=62),
                probability=0.95,
                confidence_level=ConfidenceLevel.HIGH
            )]
            mock_process.return_value = mock_entities
            
            response = await engine.search(sample_request)
            
            assert isinstance(response, ContextSearchResponse)
            assert response.stage == 3
            assert response.method == "context_analysis"
            assert len(response.items) == 1
            assert response.total_items == 1
    
    @pytest.mark.asyncio
    async def test_search_no_entities_found(self, engine, sample_request):
        """Test search when no entities are found."""
        engine.is_initialized = True
        
        with patch.object(engine, '_process_entities_with_context') as mock_process:
            mock_process.return_value = []
            
            response = await engine.search(sample_request)
            
            assert len(response.items) == 0
            assert response.total_items == 0


class TestEntityProcessing:
    """Test entity processing and analysis."""
    
    @pytest.mark.asyncio
    async def test_validate_entity(self, engine, sample_entity):
        """Test entity validation."""
        engine.is_initialized = True
        
        with patch.object(engine, 'ollama_client') as mock_client:
            mock_client.validate_entity.return_value = {
                "is_valid": True,
                "confidence": 0.95,
                "reasoning": "Valid email format"
            }
            
            result = await engine.validate_entity(
                sample_entity.id,
                sample_entity.text,
                sample_entity.context
            )
            
            assert result["is_valid"] is True
            assert result["confidence"] == 0.95
    
    @pytest.mark.asyncio
    async def test_check_false_positive(self, engine):
        """Test false positive checking."""
        engine.is_initialized = True
        
        with patch.object(engine, 'ollama_client') as mock_client:
            mock_client.check_false_positive.return_value = {
                "is_false_positive": False,
                "confidence": 0.88,
                "reasoning": "Legitimate email address"
            }
            
            result = await engine.check_false_positive(
                "john@example.com",
                "Contact: john@example.com",
                PIIType.EMAIL
            )
            
            assert result["is_false_positive"] is False
            assert result["confidence"] == 0.88


class TestUtilityMethods:
    """Test utility and helper methods."""
    
    def test_extract_context(self, engine):
        """Test context extraction around entities."""
        text = "Hello world, this is a test sentence for context extraction."
        context = engine._extract_context(text, 13, 17, window=10)  # "this"
        expected = "world, this is a te"
        assert context == expected
    
    def test_extract_context_at_start(self, engine):
        """Test context extraction at text start."""
        text = "Hello world"
        context = engine._extract_context(text, 0, 5, window=3)  # "Hello"
        assert context == "Hello wo"
    
    def test_extract_context_at_end(self, engine):
        """Test context extraction at text end."""
        text = "Hello world"
        context = engine._extract_context(text, 6, 11, window=3)  # "world"
        assert context == "lo world"
    
    def test_calculate_confidence_level(self, engine):
        """Test confidence level calculation."""
        assert engine._calculate_confidence_level(0.95) == ConfidenceLevel.HIGH
        assert engine._calculate_confidence_level(0.8) == ConfidenceLevel.MEDIUM
        assert engine._calculate_confidence_level(0.6) == ConfidenceLevel.LOW
        assert engine._calculate_confidence_level(0.3) == ConfidenceLevel.LOW
    
    def test_generate_summary(self, engine):
        """Test summary generation."""
        entities = [
            DetectedEntity(
                id="1", text="john@example.com", type=PIIType.EMAIL,
                language="english", position=Position(start=0, end=16),
                probability=0.95, confidence_level=ConfidenceLevel.HIGH
            ),
            DetectedEntity(
                id="2", text="John Doe", type=PIIType.NAME,
                language="english", position=Position(start=20, end=28),
                probability=0.85, confidence_level=ConfidenceLevel.MEDIUM
            )
        ]
        
        summary = engine._generate_summary(entities)
        
        assert summary["total_entities"] == 2
        assert summary["by_type"]["email"] == 1
        assert summary["by_type"]["name"] == 1
        assert summary["by_confidence"]["high"] == 1
        assert summary["by_confidence"]["medium"] == 1


class TestErrorHandling:
    """Test error handling scenarios."""
    
    @pytest.mark.asyncio
    async def test_search_with_empty_text(self, engine):
        """Test search with empty text."""
        engine.is_initialized = True
        
        request = ContextSearchRequest(
            text="",
            languages=["english"]
        )
        
        response = await engine.search(request)
        assert len(response.items) == 0
    
    @pytest.mark.asyncio
    async def test_search_with_unsupported_language(self, engine):
        """Test search with unsupported language."""
        engine.is_initialized = True
        
        request = ContextSearchRequest(
            text="Test text",
            languages=["unsupported_language"]
        )
        
        with patch.object(engine, '_process_entities_with_context') as mock_process:
            mock_process.return_value = []
            
            response = await engine.search(request)
            assert len(response.items) == 0
    
    @pytest.mark.asyncio
    async def test_ollama_connection_error(self, engine):
        """Test handling of Ollama connection errors."""
        engine.is_initialized = True
        
        with patch.object(engine, 'ollama_client') as mock_client:
            mock_client.validate_entity.side_effect = Exception("Connection error")
            
            with pytest.raises(Exception):
                await engine.validate_entity("test-id", "test@example.com", "context")