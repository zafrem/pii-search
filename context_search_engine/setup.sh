#!/bin/bash

# Context Search Engine Setup Script

echo "Setting up PII Search Context Search Engine..."

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

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p models data/raw data/processed logs prompts

# Copy environment file
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

echo "Setup completed successfully!"
echo ""
echo "⚠️  IMPORTANT: Make sure Ollama is installed and running:"
echo "1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh"
echo "2. Start Ollama: ollama serve &"
echo "3. Pull models: ollama pull llama3.2:3b"
echo ""
echo "To start the Context Search Engine:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the server: python start.py"
echo ""
echo "The API will be available at: http://localhost:8001"
echo "API documentation: http://localhost:8001/docs"