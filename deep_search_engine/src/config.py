import os
import yaml
from typing import Dict, List, Any
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
            # Return default configuration if file not found
            return self._default_config()
    
    def _default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            "server": {
                "host": "127.0.0.1",
                "port": 8000,
                "workers": 1
            },
            "models": {
                "default_model": "bert-base-multilingual-cased",
                "model_path": "./models",
                "cache_size": 100
            },
            "languages": {
                "supported": ["korean", "english", "chinese", "japanese", "spanish", "french"]
            },
            "detection": {
                "confidence_threshold": 0.7,
                "context_window": 50,
                "max_text_length": 10000
            }
        }
    
    @property
    def server_host(self) -> str:
        return os.getenv("DEEP_SEARCH_HOST", self._config["server"]["host"])
    
    @property
    def server_port(self) -> int:
        return int(os.getenv("DEEP_SEARCH_PORT", self._config["server"]["port"]))
    
    @property
    def server_workers(self) -> int:
        return int(os.getenv("DEEP_SEARCH_WORKERS", self._config["server"]["workers"]))
    
    @property
    def supported_languages(self) -> List[str]:
        return self._config["languages"]["supported"]
    
    @property
    def default_model(self) -> str:
        return self._config["models"]["default_model"]
    
    @property
    def model_path(self) -> str:
        return self._config["models"]["model_path"]
    
    @property
    def confidence_threshold(self) -> float:
        return self._config["detection"]["confidence_threshold"]
    
    @property
    def max_text_length(self) -> int:
        return self._config["detection"]["max_text_length"]
    
    @property
    def debug(self) -> bool:
        return os.getenv("DEBUG", "false").lower() == "true"

# Global configuration instance
config = Config()