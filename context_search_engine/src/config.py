import os
import yaml
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class Config:
    def __init__(self, config_path: str = "config/config.yaml"):
        self.config_path = config_path
        self._config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                return yaml.safe_load(file)
        except FileNotFoundError:
            return self._default_config()
    
    def _default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            "server": {
                "host": "127.0.0.1",
                "port": 8001,
                "workers": 1,
                "max_concurrent_requests": 10
            },
            "ollama": {
                "host": "http://localhost:11434",
                "default_model": "llama3.2:1b",
                "timeout": 60,
                "max_retries": 3
            },
            "analysis": {
                "context_window_size": 300,
                "confidence_threshold": 0.7,
                "max_text_length": 10000
            },
            "languages": {
                "supported": ["korean", "english", "chinese", "japanese", "spanish", "french"]
            }
        }
    
    # Server Configuration
    @property
    def server_host(self) -> str:
        return os.getenv("CONTEXT_SEARCH_HOST", self._config["server"]["host"])
    
    @property
    def server_port(self) -> int:
        return int(os.getenv("CONTEXT_SEARCH_PORT", self._config["server"]["port"]))
    
    @property
    def server_workers(self) -> int:
        return int(os.getenv("CONTEXT_SEARCH_WORKERS", self._config["server"]["workers"]))
    
    @property
    def max_concurrent_requests(self) -> int:
        return int(os.getenv("MAX_CONCURRENT_REQUESTS", 
                            self._config["server"]["max_concurrent_requests"]))
    
    # Ollama Configuration
    @property
    def ollama_host(self) -> str:
        return os.getenv("OLLAMA_HOST", self._config["ollama"]["host"])
    
    @property
    def ollama_model(self) -> str:
        return os.getenv("OLLAMA_MODEL", self._config["ollama"]["default_model"])
    
    @property
    def ollama_timeout(self) -> int:
        return int(os.getenv("OLLAMA_TIMEOUT", self._config["ollama"]["timeout"]))
    
    @property
    def ollama_max_retries(self) -> int:
        return int(os.getenv("OLLAMA_MAX_RETRIES", self._config["ollama"]["max_retries"]))
    
    # Analysis Configuration
    @property
    def context_window_size(self) -> int:
        return int(os.getenv("CONTEXT_WINDOW_SIZE", 
                            self._config["analysis"]["context_window_size"]))
    
    @property
    def confidence_threshold(self) -> float:
        return float(os.getenv("CONFIDENCE_THRESHOLD", 
                              self._config["analysis"]["confidence_threshold"]))
    
    @property
    def max_text_length(self) -> int:
        return self._config["analysis"]["max_text_length"]
    
    # Language Configuration
    @property
    def supported_languages(self) -> List[str]:
        return self._config["languages"]["supported"]
    
    @property
    def model_preferences(self) -> Dict[str, str]:
        return self._config.get("languages", {}).get("model_preferences", {})
    
    # Available Models
    @property
    def available_models(self) -> Dict[str, str]:
        return self._config.get("ollama", {}).get("models", {
            "fast": "llama3.2:1b",
            "balanced": "llama3.2:3b",
            "accurate": "phi3:3.8b",
            "multilingual": "qwen2.5:3b"
        })
    
    # Analysis Modes
    @property
    def analysis_modes(self) -> Dict[str, Dict[str, Any]]:
        return self._config.get("analysis", {}).get("modes", {
            "fast": {
                "model": "llama3.2:1b",
                "max_tokens": 100,
                "temperature": 0.1
            },
            "standard": {
                "model": "llama3.2:3b",
                "max_tokens": 200,
                "temperature": 0.2
            },
            "thorough": {
                "model": "phi3:3.8b",
                "max_tokens": 300,
                "temperature": 0.1
            }
        })
    
    # Prompts
    @property
    def prompts(self) -> Dict[str, str]:
        return self._config.get("prompts", {})
    
    @property
    def base_system_prompt(self) -> str:
        return self.prompts.get("base_system_prompt", 
            "You are a privacy expert analyzing text to identify genuine PII.")
    
    @property
    def context_analysis_prompt(self) -> str:
        return self.prompts.get("context_analysis", "")
    
    @property
    def false_positive_prompt(self) -> str:
        return self.prompts.get("false_positive_detection", "")
    
    @property
    def multilingual_prompt(self) -> str:
        return self.prompts.get("multilingual_context", "")
    
    # PII Risk Categories
    @property
    def high_risk_pii(self) -> List[str]:
        return self._config.get("pii_types", {}).get("high_risk", 
            ["ssn", "credit_card", "id_number"])
    
    @property
    def medium_risk_pii(self) -> List[str]:
        return self._config.get("pii_types", {}).get("medium_risk", 
            ["email", "phone", "address"])
    
    @property
    def low_risk_pii(self) -> List[str]:
        return self._config.get("pii_types", {}).get("low_risk", 
            ["name", "organization", "date", "postal_code"])
    
    # Performance Settings
    @property
    def request_timeout(self) -> int:
        return int(os.getenv("REQUEST_TIMEOUT", 
                            self._config.get("performance", {}).get("request_timeout", 30)))
    
    @property
    def cache_enabled(self) -> bool:
        return os.getenv("ENABLE_CACHING", "true").lower() == "true"
    
    @property
    def cache_ttl(self) -> int:
        return int(os.getenv("CACHE_TTL", 
                            self._config.get("performance", {}).get("cache_ttl", 300)))
    
    # Monitoring Settings
    @property
    def enable_metrics(self) -> bool:
        return os.getenv("ENABLE_METRICS", "true").lower() == "true"
    
    @property
    def log_level(self) -> str:
        return os.getenv("LOG_LEVEL", "INFO").upper()
    
    @property
    def log_requests(self) -> bool:
        return os.getenv("LOG_REQUESTS", "true").lower() == "true"
    
    @property
    def log_responses(self) -> bool:
        return os.getenv("LOG_RESPONSES", "false").lower() == "true"
    
    # Development Settings
    @property
    def debug(self) -> bool:
        return os.getenv("DEBUG", "false").lower() == "true"
    
    @property
    def development_mode(self) -> bool:
        return os.getenv("DEVELOPMENT_MODE", "false").lower() == "true"
    
    def get_model_for_language(self, language: str) -> str:
        """Get the preferred model for a specific language."""
        return self.model_preferences.get(language, self.ollama_model)
    
    def get_analysis_mode_config(self, mode: str) -> Dict[str, Any]:
        """Get configuration for a specific analysis mode."""
        return self.analysis_modes.get(mode, self.analysis_modes.get("standard", {}))
    
    def get_risk_level_for_pii_type(self, pii_type: str) -> str:
        """Determine risk level for a PII type."""
        if pii_type in self.high_risk_pii:
            return "high"
        elif pii_type in self.medium_risk_pii:
            return "medium"
        elif pii_type in self.low_risk_pii:
            return "low"
        else:
            return "medium"  # Default

# Global configuration instance
config = Config()