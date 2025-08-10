#!/usr/bin/env python3
"""
PII Data Labeling Backend Startup Script
"""

import sys
import os
import logging
import uvicorn

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def setup_logging():
    """Setup logging configuration."""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('labeling_backend.log')
        ]
    )

def main():
    """Main function to start the server."""
    setup_logging()
    logger = logging.getLogger(__name__)
    
    logger.info("Starting PII Data Labeling Backend...")
    logger.info("Server will run on http://127.0.0.1:8002")
    
    try:
        # Start the server
        uvicorn.run(
            "src.api.main:app",
            host="127.0.0.1",
            port=8002,
            reload=True,
            log_level="info"
        )
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server failed to start: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()