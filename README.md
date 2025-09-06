# PII Search

A comprehensive multi-language PII (Personally Identifiable Information) detection system with 3-stage sequential execution using rule-based matching, ML binary classification, and LLM-powered context analysis.

## 🎯 Overview

This application provides progressive PII detection with three specialized stages:

1. **Stage 1: Basic Search** - Rule-based pattern matching using regex patterns
2. **Stage 2: Deep Search** - ML binary classification with TF-IDF and Logistic Regression
3. **Stage 3: Context Search** - LLM-powered context validation using Ollama

### ✨ Key Features

- **Multi-language Support**: Korean, English, Chinese, Japanese, Spanish, French
- **Sequential Processing**: 3-stage pipeline with accumulated results
- **Interactive Labeling**: Sentence selection and annotation system for model training
- **Privacy-First**: Local processing only, no external API calls
- **Real-time Feedback**: Confidence scoring and detailed analytics
- **Docker Support**: Full containerization with docker-compose
- **Production Ready**: Health checks, logging, and monitoring

## 🚀 Demo

![Demo](./image/PII_Search.gif)

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation Methods](#installation-methods)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Docker Deployment](#docker-deployment)
- [Contributing](#contributing)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+
- **Ollama** (for LLM functionality)
- **Docker** (optional, for containerized deployment)

### Installation & Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd pii-search

# 2. Install main dependencies
npm install

# 3. Install backend dependencies
cd backend && npm install && cd ..

# 4. Install frontend dependencies
cd frontend && npm install && cd ..

# 5. Setup Python engines
cd deep_search_engine && ./setup.sh && cd ..
cd context_search_engine && ./setup.sh && cd ..

# 6. Install Ollama and models
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b
```

### Running the Application

#### Method 1: Development Mode (Recommended for development)

```bash
# Start main application (frontend + backend)
npm run dev

# In separate terminals, start Python engines:
# Terminal 2:
cd deep_search_engine && source venv/bin/activate && python start.py

# Terminal 3:
cd context_search_engine && source venv/bin/activate && python start.py
```

#### Method 2: Production Scripts

```bash
# Start all services
./start.sh

# Stop all services
./stop.sh
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Deep Search Engine**: http://localhost:8000
- **Context Search Engine**: http://localhost:8001
- **Labeling System**: http://localhost:3002 (optional)

## 📖 Installation Methods

### Local Development

Follow the [Quick Start](#quick-start) guide above for local development setup.

### Docker Deployment

#### Core Services Only

```bash
# Build and start core services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

#### With Labeling System

```bash
# Start with labeling system
docker-compose --profile labeling up --build
```

#### Production Deployment

```bash
# Production mode
./start-prod.sh

# Stop production
./stop-prod.sh
```

## 📚 Usage Guide

### Basic Workflow

1. **Text Input**: 
   - Enter text (up to 10,000 characters)
   - Select target languages for detection
   - Configure detection parameters

2. **Stage 1 - Basic Search**: 
   - Click "Start Basic Search"
   - Rule-based pattern matching
   - Immediate results with basic PII types

3. **Stage 2 - Deep Search**: 
   - Click "Continue to Deep Search"
   - ML-powered classification
   - Enhanced accuracy with probability scores

4. **Stage 3 - Context Search**: 
   - Click "Continue to Context Search"
   - LLM analysis for context validation
   - Final verification and confidence scoring

### Supported PII Types

- **Personal Names** (first, last, full names)
- **Email Addresses** (various formats)
- **Phone Numbers** (international formats)
- **Social Security Numbers** (SSN)
- **Credit Card Numbers**
- **Addresses** (street, city, postal codes)
- **Organizations** (company names)
- **Dates** (birth dates, sensitive dates)
- **ID Numbers** (various government IDs)

### Language Support

- **Korean** (한국어) - Native pattern support
- **English** - Comprehensive pattern library
- **Chinese** (中文) - Simplified and Traditional
- **Japanese** (日本語) - Hiragana, Katakana, Kanji
- **Spanish** (Español) - Regional variations
- **French** (Français) - European standard

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Deep Search    │
│   React + TS    │◄──►│   Node.js + TS  │◄──►│  Python + ML    │
│   Port: 3000    │    │   Port: 3001    │    │  Port: 8000     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Context Search  │    │     Ollama      │
                       │ Python + LLM    │◄──►│   LLM Server    │
                       │ Port: 8001      │    │  Port: 11434    │
                       └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Custom Hooks** for state management
- **Responsive Design** for all devices

#### Backend
- **Node.js** with Express framework
- **TypeScript** for type safety
- **Winston** for logging
- **Helmet** for security headers
- **CORS** configuration

#### Deep Search Engine
- **Python 3.8+** with FastAPI
- **scikit-learn** for ML models
- **TF-IDF** vectorization
- **Logistic Regression** classification
- **NLTK** for text processing

#### Context Search Engine
- **Python 3.8+** with FastAPI
- **Ollama** integration for LLM
- **Transformers** library
- **Async processing** for performance

#### Data Labeling System
- **React** frontend for annotation
- **Python** backend with SQLite
- **Export formats**: HuggingFace, spaCy, JSON

## 📡 API Documentation

### Backend API Endpoints

#### Search Operations
```http
POST /api/search/basic
Content-Type: application/json

{
  "text": "Hello, my name is John Doe",
  "languages": ["english"],
  "maxCharacters": 10000
}
```

#### Health Check
```http
GET /api/health
```

### Deep Search Engine API

#### Search Endpoint
```http
POST /search
Content-Type: application/json

{
  "text": "Sample text for analysis",
  "stage1Results": { /* Basic search results */ }
}
```

### Context Search Engine API

#### Context Analysis
```http
POST /search
Content-Type: application/json

{
  "text": "Text to analyze",
  "previousDetections": [ /* Previous stage results */ ]
}
```

## 🛠️ Development

### Project Structure

```
pii-search/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
├── backend/                 # Node.js backend
│   └── src/
│       ├── routes/         # API routes
│       ├── middleware/     # Express middleware
│       └── types/          # TypeScript types
├── engines/                # Pattern matching engines
│   ├── patterns/          # Language-specific patterns
│   ├── stage1/           # Rule-based engine
│   └── utils/            # Utility functions
├── deep_search_engine/     # ML-based detection
│   ├── src/              # Python source code
│   ├── models/           # Trained models
│   └── config/           # Configuration files
├── context_search_engine/  # LLM-based validation
│   ├── src/              # Python source code
│   └── config/           # Configuration files
└── deep_search_labeling/   # Data annotation system
    ├── frontend/         # Labeling interface
    └── backend/          # Annotation backend
```

### Available Scripts

```bash
# Development
npm run dev              # Start frontend + backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Building
npm run build           # Build all components
npm run build:frontend  # Build frontend
npm run build:backend   # Build backend

# Testing
npm run test           # Run all tests
npm run test:frontend  # Test frontend
npm run test:backend   # Test backend

# Linting
npm run lint           # Lint all code
npm run lint:frontend  # Lint frontend
npm run lint:backend   # Lint backend

# Docker
npm run docker:build   # Build Docker images
npm run docker:up      # Start containers
npm run docker:down    # Stop containers
```

### Environment Configuration

Create `.env` files in respective directories:

#### Backend `.env`
```env
NODE_ENV=development
PORT=3001
DEEP_SEARCH_URL=http://localhost:8000
CONTEXT_SEARCH_URL=http://localhost:8001
LOG_LEVEL=info
```

#### Deep Search Engine `.env`
```env
HOST=0.0.0.0
PORT=8000
MODEL_PATH=./models/
LOG_LEVEL=info
```

#### Context Search Engine `.env`
```env
HOST=0.0.0.0
PORT=8001
OLLAMA_HOST=http://localhost:11434
MODEL_NAME=llama3.2:3b
LOG_LEVEL=info
```

## 🐳 Docker Deployment

### Quick Docker Start

```bash
# Start all core services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Service-Specific Commands

```bash
# Start specific service
docker-compose up frontend

# Rebuild specific service
docker-compose up --build backend

# Scale services
docker-compose up --scale backend=2
```

### Production Docker

```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# With labeling system
docker-compose --profile labeling up -d
```

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Make your changes
5. Run tests: `npm test`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style

- **TypeScript** for all new JavaScript code
- **ESLint** configuration provided
- **Prettier** for code formatting
- **Conventional Commits** for commit messages

### Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Maintain test coverage above 80%

## 🔒 Security & Privacy

### Privacy Features
- **Local Processing Only** - No external API calls for PII detection
- **No Data Retention** - Text is not stored server-side
- **Memory Management** - Automatic cleanup of processed data
- **Secure Defaults** - Conservative PII detection settings

### Security Measures
- **Input Validation** - Comprehensive sanitization
- **Rate Limiting** - API endpoint protection
- **HTTPS Ready** - SSL/TLS configuration
- **Security Headers** - Helmet.js integration
- **CORS Configuration** - Controlled cross-origin access

### Compliance Considerations
- **GDPR Ready** - Privacy-by-design architecture
- **HIPAA Compatible** - Local processing requirements
- **SOC 2** - Security control framework
- **Data Minimization** - Only process necessary data

## 🔧 Troubleshooting

### Common Issues

#### Installation Problems

**Node.js Version Issues**
```bash
# Check Node.js version
node --version  # Should be 16+

# Use nvm to manage versions
nvm install 16
nvm use 16
```

**Python Dependencies**
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# Install requirements
pip install -r requirements.txt
```

#### Runtime Issues

**Port Already in Use**
```bash
# Find process using port
lsof -i :3000  # Replace with your port

# Kill process
kill -9 <PID>
```

**Ollama Connection Issues**
```bash
# Check Ollama status
ollama list

# Restart Ollama
ollama serve

# Pull required model
ollama pull llama3.2:3b
```

#### Docker Issues

**Container Build Failures**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Memory Issues**
```bash
# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory
```

### Performance Optimization

#### Frontend Optimization
- Enable React strict mode
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Optimize bundle size with code splitting

#### Backend Optimization
- Enable gzip compression
- Implement caching strategies
- Use connection pooling
- Monitor memory usage

#### ML Engine Optimization
- Batch processing for multiple requests
- Model caching and preloading
- Async processing pipelines
- Resource monitoring

### Logging and Monitoring

#### Log Locations
- **Frontend**: Browser console
- **Backend**: `backend/logs/`
- **Deep Search**: `deep_search_engine/logs/`
- **Context Search**: `context_search_engine/logs/`

#### Monitoring Endpoints
- **Health Checks**: `/health` on each service
- **Metrics**: Prometheus-compatible endpoints
- **Status**: Service-specific status pages

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** for local LLM capabilities
- **Hugging Face** for transformer models
- **React** and **TypeScript** communities
- **scikit-learn** for ML algorithms
- **FastAPI** for Python web framework

---

For detailed learning and training processes, see [PII_LEARNING_MANUAL.md](PII_LEARNING_MANUAL.md).