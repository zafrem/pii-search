# Deep Search Engine

An advanced AI-powered PII detection engine with parallel processing capabilities, featuring state-of-the-art transformer models and cascaded detection architecture.

## 🎯 Overview

The Deep Search Engine provides multiple AI-powered detection methods with advanced parallel processing:

1. **Cascaded AI Detection** - Multilingual BERT → DeBERTa v3 → Ollama LLM pipeline
2. **Simple Learning Engine** - Adaptive ML with continuous training capabilities  
3. **Model Comparison** - Side-by-side analysis of different AI approaches
4. **Parallel Processing** - All models run simultaneously for maximum speed

## ✨ Key Features

### 🧠 **Advanced AI Models**
- **Multilingual BERT** (`bert-base-multilingual-cased`) - 104+ language support
- **DeBERTa v3** (`microsoft/deberta-v3-base`) - Advanced text understanding
- **Ollama LLM** (`llama3.2:3b`) - Context-aware analysis
- **Simple ML** - Traditional TF-IDF + Logistic Regression for comparison

### 🚀 **Parallel Processing Architecture**
- **Simultaneous Execution** - All AI models run concurrently
- **Result Merging** - Intelligent deduplication and confidence scoring
- **Model Comparison** - View individual results from each model
- **Performance Optimization** - ~3x speed improvement over sequential processing

### 📊 **Detection Capabilities**
- **Binary Classification** - PII vs Non-PII detection
- **Confidence Scoring** - Probability estimates for each detection
- **Context Analysis** - Understanding surrounding text for better accuracy
- **Multi-language Support** - Process text in multiple languages simultaneously

### 🔄 **Adaptive Learning**
- **Continuous Training** - Model improvement from user feedback
- **Model Management** - Version control and rollback capabilities
- **Export/Import** - Training data exchange with labeling system
- **Quality Metrics** - Performance tracking and analytics

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip package manager
- 4GB+ RAM (for AI models)
- CUDA-compatible GPU (optional, for faster inference)

### Installation

#### Method 1: Automated Setup (Recommended)
```bash
# Run the setup script
./setup.sh
```

#### Method 2: Manual Setup
```bash
# 1. Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# 2. Install dependencies
pip install -r requirements.txt

# 3. Download AI models (automatic on first run)
python start.py
```

### Running the Engine

#### Development Mode
```bash
# Start with development settings
python start.py

# Or use the startup script
./start.sh
```

#### Production Mode
```bash
# Start with production settings
uvicorn src.api:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker Deployment
```bash
# Build container
docker build -t deep-search-engine .

# Run container
docker run -p 8000:8000 deep-search-engine
```

## 📡 API Documentation

### Core Search Endpoints

#### Standard PII Search
```http
POST /search
Content-Type: application/json

{
  "text": "My name is John Doe and my email is john@example.com",
  "languages": ["english"],
  "confidence_threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-123",
        "text": "John Doe",
        "type": "name",
        "classification": "pii",
        "position": {"start": 11, "end": 19},
        "probability": 0.95,
        "confidence_level": "high",
        "sources": ["multilingual-bert"]
      }
    ],
    "model_info": {
      "method": "parallel-cascaded-detection",
      "models_used": ["multilingual-bert", "deberta-v3", "ollama-llm"]
    }
  }
}
```

#### Separate Results Analysis  
```http
POST /search/separate-results
Content-Type: application/json

{
  "text": "Contact Jane Smith at jane@company.com or (555) 123-4567",
  "languages": ["english"],
  "confidence_threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "separate_results": true,
    "model_details": {
      "english": {
        "model_results": {
          "multilingual_bert": {
            "results": [...],
            "count": 3,
            "status": "success"
          },
          "deberta_v3": {
            "results": [...],
            "count": 2, 
            "status": "success"
          },
          "ollama": {
            "results": [...],
            "count": 4,
            "status": "success"
          }
        }
      }
    }
  }
}
```

#### Model Comparison
```http
POST /search/compare-models
Content-Type: application/json

{
  "text": "Employee ID: EMP12345, Name: Sarah Johnson, SSN: 123-45-6789",
  "languages": ["english"]
}
```

### Detection Control

#### Enable Cascaded Detection
```http
POST /detection/set-cascaded
Content-Type: application/json

{
  "enabled": true
}
```

#### Get Detection Status
```http
GET /detection/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_mode": "cascaded",
    "cascaded_detection_ready": true,
    "available_models": {
      "multilingual_bert": true,
      "deberta_v3": true,
      "ollama": true
    }
  }
}
```

### Training & Learning

#### Get Training Status
```http
GET /training/status
```

#### Add Training Data
```http
POST /training/data
Content-Type: application/json

{
  "samples": [
    {
      "text": "Contact John at john@email.com",
      "annotations": [
        {
          "start": 8,
          "end": 12,
          "text": "John", 
          "label": "name"
        }
      ]
    }
  ]
}
```

#### List Available Models
```http
GET /models
```

### Health & Monitoring

#### Health Check
```http
GET /health
```

#### Metrics
```http
GET /metrics
```

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    Deep Search Engine                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │   FastAPI   │ │   Engine    │ │  Cascaded   │ │   Simple    │ │
│  │   Server    │ │  Manager    │ │  Detector   │ │  Learning   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      AI Model Layer                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │Multilingual │ │  DeBERTa    │ │   Ollama    │                │
│  │    BERT     │ │     v3      │ │    LLM      │                │
│  │   (local)   │ │  (local)    │ │ (external)  │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
├─────────────────────────────────────────────────────────────────┤
│                    Processing Pipeline                          │
│  Text → Tokenization → Model Inference → Result Merging        │
│   ↓         ↓              ↓                   ↓               │
│  Async  Parallel      Confidence         Deduplication        │
│         Execution      Scoring                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Detection Flow

```
Input Text
     │
     ▼
┌─────────────────┐
│ Detection Router│  
└─────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Parallel Model Execution                          │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │    BERT     │ │  DeBERTa    │ │   Ollama    │                │
│  │  Analysis   │ │  Analysis   │ │  Analysis   │ ← asyncio.gather│
│  └─────────────┘ └─────────────┘ └─────────────┘                │
│       │               │               │                        │
│       ▼               ▼               ▼                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │   Results   │ │   Results   │ │   Results   │                │
│  │     A       │ │     B       │ │     C       │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                Result Processing                                │
│  • Merge overlapping detections                                │
│  • Assign confidence scores                                    │
│  • Deduplicate entities                                        │
│  • Format output                                               │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
Final Results
```

## 🛠️ Development

### Project Structure

```
deep_search_engine/
├── src/
│   ├── api.py                    # FastAPI server
│   ├── engine.py                 # Main detection engine
│   ├── cascaded_pii_detector.py  # Parallel AI detection
│   ├── simple_learning_engine.py # Adaptive ML engine
│   ├── model_manager.py          # Model version control
│   ├── models.py                 # Data models/schemas
│   ├── config.py                 # Configuration management
│   └── utils.py                  # Utility functions
├── models/
│   ├── multilingual-bert/        # BERT model cache
│   ├── deberta-v3/               # DeBERTa model cache
│   ├── simple_classifier.pkl     # Simple ML model
│   └── versions/                 # Model versions
├── data/
│   ├── raw/                      # Raw training data
│   └── processed/                # Processed datasets
├── logs/                         # Application logs
├── tests/                        # Unit tests
├── requirements.txt              # Python dependencies
├── start.py                      # Application entry point
├── start.sh                      # Startup script
└── setup.sh                     # Setup script
```

### Configuration

Create `.env` file for environment variables:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=false

# Model Configuration
MODEL_CACHE_DIR=./models
DEFAULT_MODEL=bert-base-multilingual-cased
ENABLE_CASCADED_DETECTION=true

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# Performance Settings
MAX_TEXT_LENGTH=50000
BATCH_SIZE=32
ENABLE_GPU=true

# Logging
LOG_LEVEL=info
LOG_FILE=logs/deep_search.log
```

### Development Scripts

```bash
# Start development server
python start.py

# Run with auto-reload
uvicorn src.api:app --reload --host 0.0.0.0 --port 8000

# Run tests
python -m pytest tests/

# Format code
black src/
isort src/

# Lint code  
flake8 src/
mypy src/

# Build Docker image
docker build -t deep-search-engine .
```

### Adding New Models

To integrate a new AI model:

1. **Add model loading** in `cascaded_pii_detector.py`:
```python
async def _load_new_model(self):
    self.new_model = NewModel.from_pretrained('model-name')
```

2. **Add detection method**:
```python
async def _detect_with_new_model(self, text: str, language: str) -> List[PIIClassificationResult]:
    # Implementation here
    pass
```

3. **Update parallel execution** in `detect_pii_parallel()`:
```python
tasks.append(self._detect_with_new_model(text, language))
task_names.append("new_model")
```

### Performance Optimization

#### Model Caching
- Models are cached locally after first download
- Use persistent volumes in Docker for model storage
- Pre-warm models during startup

#### Memory Management
```python
# Clear model cache when needed
torch.cuda.empty_cache()
gc.collect()
```

#### Batch Processing
```python
# Process multiple texts efficiently
results = await asyncio.gather(*[
    self.detect_pii_parallel(text) 
    for text in batch_texts
])
```

## 🧪 Testing

### Unit Tests
```bash
# Run all tests
python -m pytest tests/

# Run with coverage
python -m pytest --cov=src tests/

# Run specific test
python -m pytest tests/test_cascaded_detector.py
```

### Integration Tests
```bash
# Test API endpoints
python -m pytest tests/test_api.py

# Test model loading
python -m pytest tests/test_models.py
```

### Performance Tests
```bash
# Benchmark detection speed
python tests/benchmark_detection.py

# Memory usage analysis
python tests/memory_profiling.py
```

## 📊 Monitoring & Analytics

### Metrics Collection
- **Request latency** - Response time per detection
- **Model performance** - Accuracy and F1 scores
- **Resource usage** - CPU, memory, GPU utilization
- **Error rates** - Failed requests and model errors

### Logging
- **Structured logging** with JSON format
- **Log levels**: DEBUG, INFO, WARNING, ERROR
- **Log rotation** to manage disk space
- **Centralized logging** support (ELK stack)

### Health Checks
```bash
# Basic health check
curl http://localhost:8000/health

# Detailed status
curl http://localhost:8000/detection/status

# Model information
curl http://localhost:8000/models
```

## 🚀 Production Deployment

### Docker Deployment
```yaml
version: '3.8'
services:
  deep-search:
    build: .
    ports:
      - "8000:8000"
    environment:
      - HOST=0.0.0.0
      - PORT=8000
      - ENABLE_GPU=true
    volumes:
      - ./models:/app/models
      - ./logs:/app/logs
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deep-search-engine
spec:
  replicas: 3
  selector:
    matchLabels:
      app: deep-search-engine
  template:
    spec:
      containers:
      - name: deep-search
        image: deep-search-engine:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
          limits:
            memory: "8Gi"
            cpu: "4"
```

### Load Balancing
- Use nginx or HAProxy for load balancing
- Health check endpoint: `/health`
- Session affinity not required (stateless)

### Scaling Considerations
- **CPU-bound**: Scale horizontally with multiple replicas
- **Memory-intensive**: Ensure adequate RAM per instance
- **GPU acceleration**: Use GPU-enabled instances for faster inference
- **Model caching**: Share model cache across instances

## 🔒 Security & Privacy

### Data Protection
- **No data retention** - Text is not stored permanently
- **Memory cleanup** - Sensitive data cleared after processing
- **Secure transport** - HTTPS/TLS encryption
- **Input validation** - Comprehensive sanitization

### Model Security
- **Local processing** - All AI models run locally
- **Model integrity** - Checksum verification for downloaded models
- **Access control** - API authentication and authorization
- **Audit logging** - Track all detection requests

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 🙏 Acknowledgments

- **Hugging Face** for transformer models
- **Microsoft** for DeBERTa architecture  
- **Google** for BERT and multilingual models
- **Ollama** for local LLM capabilities
- **FastAPI** for modern Python web framework