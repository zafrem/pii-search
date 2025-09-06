#!/bin/bash

# Deep Search Engine Setup Script

echo "Setting up PII Search Deep Search Engine..."

# Check if Python 3.8+ is available
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then
    echo "Error: Python 3.8 or higher is required. Found: $python_version"
    exit 1
fi

echo "Python version check passed: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Initialize NLTK data
echo "Initializing NLTK data..."
python -c "
import nltk
import ssl

# Handle SSL issues that can occur with NLTK downloads
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download required NLTK data
print('Downloading NLTK punkt tokenizer...')
try:
    nltk.download('punkt', quiet=True)
    print('NLTK punkt downloaded successfully')
except Exception as e:
    print(f'NLTK punkt download failed: {e}')

try:
    nltk.download('stopwords', quiet=True)
    print('NLTK stopwords downloaded successfully')
except Exception as e:
    print(f'NLTK stopwords download failed: {e}')
"

# Download spaCy models (optional for enhanced NLP features)
echo "Downloading spaCy language models (optional)..."
python -m spacy download en_core_web_sm || echo "Warning: English spaCy model not available"
python -m spacy download es_core_news_sm || echo "Warning: Spanish spaCy model not available"
python -m spacy download fr_core_news_sm || echo "Warning: French spaCy model not available"

# Try to download additional models (may fail on some systems)
echo "Attempting to download additional language models..."
python -m spacy download zh_core_web_sm || echo "Warning: Chinese model not available"
python -m spacy download ja_core_news_sm || echo "Warning: Japanese model not available"
python -m spacy download ko_core_news_sm || echo "Warning: Korean model not available"

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p models data/raw data/processed logs

# Copy environment file
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

echo "Setup completed successfully!"
echo ""
echo "To start the Deep Search Engine:"
echo "1. Use the start script: ./start.sh"
echo "   OR"
echo "2. Manual start:"
echo "   - Activate virtual environment: source venv/bin/activate"
echo "   - Run server: python start.py"
echo ""
echo "The API will be available at: http://localhost:8000"
echo "API documentation: http://localhost:8000/docs"
