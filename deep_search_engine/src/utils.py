import logging
import time
from functools import wraps
from typing import Any, Callable

def setup_logging(level: str = "INFO"):
    """Setup logging configuration."""
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('deep_search.log')
        ]
    )

def timer(func: Callable) -> Callable:
    """Decorator to measure execution time."""
    @wraps(func)
    async def async_wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        result = await func(*args, **kwargs)
        end_time = time.time()
        logger = logging.getLogger(func.__module__)
        logger.info(f"{func.__name__} took {end_time - start_time:.2f} seconds")
        return result
    
    @wraps(func)
    def sync_wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        logger = logging.getLogger(func.__module__)
        logger.info(f"{func.__name__} took {end_time - start_time:.2f} seconds")
        return result
    
    if hasattr(func, '__code__') and 'async' in func.__code__.co_flags:
        return async_wrapper
    else:
        return sync_wrapper

def validate_text_input(text: str, max_length: int = 10000) -> str:
    """Validate and sanitize text input."""
    if not text or not text.strip():
        raise ValueError("Text input is required")
    
    if len(text) > max_length:
        raise ValueError(f"Text exceeds maximum length of {max_length} characters")
    
    return text.strip()

def normalize_confidence_score(score: float) -> float:
    """Normalize confidence score to 0-1 range."""
    return max(0.0, min(1.0, score))