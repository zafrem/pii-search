#!/bin/bash

# Deep Search Engine Start Script
# Handles initialization tasks and starts the server

echo "🔍 Starting PII Search Deep Search Engine..."

# Function to handle cleanup
cleanup() {
    echo "🔄 Shutting down Deep Search Engine..."
    exit 0
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup.sh first."
    exit 1
fi

# Activate virtual environment
echo "🐍 Activating virtual environment..."
source venv/bin/activate

# Check if required packages are installed
echo "📦 Checking required packages..."
python -c "import nltk, sklearn, fastapi, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Required packages not found. Installing dependencies..."
    pip install -r requirements.txt
fi

# Initialize NLTK data
echo "📚 Initializing NLTK data..."
python -c "
import nltk
import ssl
import os

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
    nltk.data.find('tokenizers/punkt')
    print('NLTK punkt tokenizer already available')
except LookupError:
    nltk.download('punkt', quiet=True)
    print('NLTK punkt tokenizer downloaded successfully')

try:
    nltk.data.find('tokenizers/punkt_tab')
    print('NLTK punkt_tab tokenizer already available')
except LookupError:
    try:
        nltk.download('punkt_tab', quiet=True)
        print('NLTK punkt_tab tokenizer downloaded successfully')
    except:
        print('NLTK punkt_tab not available, using punkt fallback')

# Download stopwords if needed
try:
    nltk.data.find('corpora/stopwords')
    print('NLTK stopwords already available')
except LookupError:
    try:
        nltk.download('stopwords', quiet=True)
        print('NLTK stopwords downloaded successfully')
    except:
        print('NLTK stopwords download failed, continuing without stopwords')

print('NLTK initialization completed')
"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p models data/raw data/processed logs

# Check if model file exists, create simple classifier if not
echo "🤖 Checking ML model..."
python -c "
import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

model_path = 'models/simple_classifier.pkl'
if not os.path.exists(model_path):
    print('Creating initial ML model...')
    
    # Create a simple pipeline with default parameters
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=5000, stop_words='english')),
        ('classifier', LogisticRegression(random_state=42))
    ])
    
    # Train with minimal sample data to initialize
    sample_texts = [
        'John Doe is a person',
        'Call me at 555-123-4567',
        'My email is john@example.com',
        'The weather is nice today',
        'This is a normal sentence',
        'No personal information here'
    ]
    sample_labels = [1, 1, 1, 0, 0, 0]  # 1 = PII, 0 = non-PII
    
    pipeline.fit(sample_texts, sample_labels)
    
    # Save the model
    os.makedirs('models', exist_ok=True)
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)
    
    print('Initial ML model created and saved')
else:
    print('ML model already exists')
"

# Start the server
echo "🚀 Starting Deep Search Engine server..."
echo "   API: http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo "   Logs: logs/deep_search.log"
echo ""
echo "🛑 Press Ctrl+C to stop the server"
echo ""

# Run the server
python start.py