#!/usr/bin/env python3
"""
Deep Search Engine Startup Script

This script starts the Deep Search Engine API server.
"""

import sys
import os
import logging
import uvicorn

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.config import config
from src.utils import setup_logging

def main():
    """Main function to start the server."""
    # Setup logging
    setup_logging(level="INFO")
    logger = logging.getLogger(__name__)
    
    logger.info("Starting PII Search Deep Search Engine...")
    logger.info(f"Server will run on {config.server_host}:{config.server_port}")
    
    try:
        # Start the server
        uvicorn.run(
            "src.api:app",
            host=config.server_host,
            port=config.server_port,
            workers=config.server_workers,
            reload=config.debug,
            log_level="info"
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()