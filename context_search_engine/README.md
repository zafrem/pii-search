# Context Search Engine

A context-aware PII validation engine powered by Ollama LLMs for Stage 3 analysis. This engine performs final validation, false positive filtering, and contextual analysis of detected PII entities.

## Features

- 🧠 **LLM-powered context analysis** using Ollama
- 🔍 **False positive detection** and filtering
- 🌍 **Multi-language contextual understanding**
- 📊 **Confidence refinement** based on surrounding context
- 🛡️ **Privacy-preserving** local LLM inference
- 🚀 **High-performance** async processing

## Architecture

The Context Search Engine operates as the final stage (Stage 3) in the PII detection pipeline:

1. **Input**: Results from Stage 1 (Rule-based) and Stage 2 (Deep Search)
2. **Analysis**: LLM evaluates context around each detected entity
3. **Validation**: Determines if detections are genuine PII or false positives
4. **Output**: Refined results with improved accuracy and context scores

## Setup

### Prerequisites

1. **Install Ollama**: Follow instructions at [ollama.ai](https://ollama.ai)
2. **Pull recommended models**:
   ```bash
   ollama pull llama3.2:3b        # Fast, lightweight model
   ollama pull phi3:3.8b          # Good for analysis tasks
   ollama pull qwen2.5:3b         # Multilingual support
   ```

### Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the service**:
   ```bash
   python start.py
   ```

## Configuration

### Ollama Models

The engine supports multiple Ollama models optimized for different use cases:

- **llama3.2:3b** - Fast inference, good general understanding
- **phi3:3.8b** - Excellent for reasoning and analysis tasks
- **qwen2.5:3b** - Strong multilingual capabilities
- **llama3.2:1b** - Ultra-fast for high-throughput scenarios

### Environment Variables

```bash
# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT=30

# API Configuration
CONTEXT_SEARCH_HOST=127.0.0.1
CONTEXT_SEARCH_PORT=8001

# Performance
MAX_CONCURRENT_REQUESTS=10
CONTEXT_WINDOW_SIZE=300
```

## API Endpoints

### Core Endpoints

- **`POST /search`** - Perform context-aware PII analysis
- **`POST /validate`** - Validate specific PII entities
- **`GET /health`** - Health check and model status
- **`GET /models`** - List available Ollama models

### Analysis Endpoints

- **`POST /analyze/context`** - Deep context analysis
- **`POST /analyze/false-positives`** - False positive detection
- **`POST /analyze/privacy-risk`** - Privacy risk assessment

## Usage Examples

### Basic Context Search

```python
import requests

payload = {
    "text": "John Smith works at Acme Corp. Contact: john@example.com",
    "previous_detections": [
        {
            "text": "John Smith",
            "type": "name",
            "position": {"start": 0, "end": 10},
            "confidence": 0.85
        }
    ],
    "languages": ["english"]
}

response = requests.post("http://localhost:8001/search", json=payload)
result = response.json()
```

### False Positive Filtering

```python
payload = {
    "text": "The movie 'John Wick' is great",
    "entity": {
        "text": "John Wick",
        "type": "name",
        "position": {"start": 11, "end": 20}
    }
}

response = requests.post("http://localhost:8001/validate", json=payload)
# Returns: {"is_genuine_pii": false, "reason": "Movie title reference"}
```

## Prompt Engineering

The engine uses carefully crafted prompts for different analysis tasks:

### Context Analysis Prompt
```
Analyze the following text to determine if the highlighted entity is genuine PII:

Text: "{text}"
Entity: "{entity}" (type: {type})
Position: {start}-{end}

Consider:
1. Is this entity referring to a real person/organization?
2. What is the surrounding context?
3. Could this be a reference, example, or fictional entity?
4. What is the privacy risk level?

Respond with a JSON object containing your analysis.
```

### Multilingual Support
The engine includes language-specific prompts and cultural context understanding for:
- English, Spanish, French, German
- Chinese (Simplified/Traditional)
- Japanese, Korean
- And more...

## Performance

- **Throughput**: 50-100 requests/second (depends on model)
- **Latency**: 100-500ms per analysis (model dependent)
- **Concurrent Processing**: Up to 10 simultaneous requests
- **Memory Usage**: 2-8GB (varies by Ollama model)

## Integration

### With Existing Backend

The Context Search Engine integrates seamlessly with the existing Node.js backend:

```javascript
// In your backend routes/search.js
const contextSearchURL = process.env.CONTEXT_SEARCH_URL || 'http://localhost:8001';

app.post('/api/search/context', async (req, res) => {
  const response = await fetch(`${contextSearchURL}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body)
  });
  
  const result = await response.json();
  res.json(result);
});
```

## Model Selection Guide

### For Development/Testing
- **llama3.2:1b** - Fastest, lowest resource usage
- **phi3:3.8b** - Good balance of speed and accuracy

### For Production
- **llama3.2:3b** - Recommended default
- **qwen2.5:7b** - Best for multilingual content
- **llama3.1:8b** - Highest accuracy, more resources

## Monitoring

The engine provides comprehensive monitoring:

- **Health checks** for Ollama connectivity
- **Performance metrics** (latency, throughput)
- **Model status** and resource usage
- **Request/response logging**
- **Error tracking** and alerting

## Security

- **Local processing** - No data sent to external APIs
- **Privacy by design** - Minimal data retention
- **Secure communication** - TLS support
- **Access controls** - API key authentication
- **Audit logging** - Complete request/response logs