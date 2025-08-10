import pytest
import asyncio
from unittest.mock import AsyncMock, patch

from src.engine import DeepSearchEngine
from src.models import DeepSearchRequest, PIIType, ConfidenceLevel

@pytest.fixture
def engine():
    return DeepSearchEngine()

@pytest.fixture
def sample_request():
    return DeepSearchRequest(
        text="Hello, my name is John Doe and my email is john@example.com",
        languages=["english"],
        confidence_threshold=0.7
    )

@pytest.mark.asyncio
async def test_engine_initialization(engine):
    """Test engine initialization."""
    with patch.object(engine, '_load_spacy_models'), \
         patch.object(engine, '_load_transformer_models'):
        await engine.initialize()
        assert engine.is_ready() == True

@pytest.mark.asyncio
async def test_search_basic_functionality(engine, sample_request):
    """Test basic search functionality."""
    # Mock the engine as initialized
    engine.is_initialized = True
    
    with patch.object(engine, '_process_language') as mock_process:
        mock_process.return_value = []
        
        response = await engine.search(sample_request)
        
        assert response.stage == 2
        assert response.method == "deep_learning"
        assert isinstance(response.items, list)
        assert isinstance(response.summary, dict)

@pytest.mark.asyncio
async def test_search_not_initialized(engine, sample_request):
    """Test search when engine is not initialized."""
    with pytest.raises(RuntimeError, match="Engine not initialized"):
        await engine.search(sample_request)

def test_confidence_level_mapping(engine):
    """Test confidence level mapping."""
    assert engine._get_confidence_level(0.95) == ConfidenceLevel.HIGH
    assert engine._get_confidence_level(0.8) == ConfidenceLevel.MEDIUM
    assert engine._get_confidence_level(0.6) == ConfidenceLevel.LOW

def test_context_extraction(engine):
    """Test context extraction around entities."""
    text = "Hello world, this is a test sentence for context extraction."
    context = engine._extract_context(text, 13, 17, window=10)  # "this"
    expected = "world, this is a te"
    assert context == expected

def test_spacy_label_mapping(engine):
    """Test spaCy label to PII type mapping."""
    assert engine._map_spacy_label_to_pii("PERSON") == PIIType.NAME
    assert engine._map_spacy_label_to_pii("ORG") == PIIType.ORGANIZATION
    assert engine._map_spacy_label_to_pii("EMAIL") == PIIType.EMAIL
    assert engine._map_spacy_label_to_pii("UNKNOWN") is None

def test_transformer_label_mapping(engine):
    """Test transformer label to PII type mapping."""
    assert engine._map_transformer_label_to_pii("PER") == PIIType.NAME
    assert engine._map_transformer_label_to_pii("ORG") == PIIType.ORGANIZATION
    assert engine._map_transformer_label_to_pii("MISC") is None