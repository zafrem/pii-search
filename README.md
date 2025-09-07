# PII Search

A comprehensive multi-language PII (Personally Identifiable Information) detection system with advanced parallel processing, cascaded detection models, and integrated data generation capabilities for training and testing.

## 🎯 Overview

This application provides multiple PII detection approaches with advanced AI models:

1. **Basic Search** - Rule-based pattern matching using regex patterns
2. **Cascaded AI Detection** - Parallel processing with Multilingual BERT → DeBERTa v3 → Ollama LLM
3. **Simple Learning Engine** - Adaptive ML with continuous training capabilities
4. **Data Generation System** - Faker-based PII data generation for training and testing

### ✨ Key Features

#### 🧠 **Advanced AI Detection**
- **Parallel Processing**: All AI models run simultaneously for maximum speed
- **Cascaded Detection**: Multilingual BERT + DeBERTa v3 + Ollama LLM pipeline
- **Model Comparison**: View separate results from each AI model
- **Adaptive Learning**: Continuous model improvement from user feedback

#### 🌍 **Multi-language Support**
- **12+ Languages**: Korean, English, Chinese, Japanese, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Arabic
- **Locale-aware Generation**: Region-specific PII patterns and formats
- **Unicode Support**: Full international character set compatibility

#### 🎯 **Data Generation & Training**
- **Faker-based Generation**: Realistic PII data using 23+ data types
- **Regex Pattern Support**: Generate data matching any regular expression
- **Template System**: Custom format generation with placeholders
- **Bulk Import**: Direct integration with labeling system for training data

#### 🏷️ **Comprehensive Labeling System**
- **Interactive Annotation**: Advanced UI for PII labeling and training
- **Export Formats**: HuggingFace, spaCy, CoNLL, JSON, CSV
- **Quality Analytics**: Inter-annotator agreement and performance metrics
- **Auto-annotation**: Pre-label generated data for faster training

#### 🔒 **Privacy & Security**
- **Local Processing**: All AI models run locally, no external API calls
- **Memory Management**: Automatic cleanup of sensitive data
- **GDPR/HIPAA Ready**: Privacy-by-design architecture
- **Secure Defaults**: Conservative detection settings

#### 🚀 **Production Features**
- **Docker Containerization**: Full stack deployment with docker-compose
- **Health Monitoring**: Comprehensive health checks and metrics
- **API Documentation**: OpenAPI/Swagger documentation
- **Scalable Architecture**: Microservices design for high availability

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

# 5. Setup Python engines (includes AI model downloads)
cd deep_search_engine && ./setup.sh && cd ..
cd context_search_engine && ./setup.sh && cd ..

# 6. Setup labeling system (optional)
cd deep_search_labeling && ./setup.sh && cd ..

# 7. Install Ollama and models
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b

# 8. Start Ollama service
ollama serve
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

### Detection Workflows

#### **Standard Detection Workflow**
1. **Text Input**: Enter text (up to 10,000 characters) and select target languages
2. **Basic Search**: Rule-based pattern matching for immediate results
3. **Deep Search**: AI-powered detection with confidence scoring
4. **Context Search**: LLM validation for final verification

#### **Advanced AI Workflow** 
1. **Parallel Detection**: All three AI models (BERT, DeBERTa, Ollama) run simultaneously
2. **Combined Results**: Merged and deduplicated findings across all models
3. **Separate Analysis**: View individual model results for comparison
4. **Model Performance**: Compare accuracy and coverage across models

#### **Data Generation Workflow**
1. **Generate Training Data**: Create realistic PII data using Faker
2. **Regex Generation**: Generate data matching custom patterns
3. **Template Generation**: Use custom templates with placeholders
4. **Bulk Import**: Import generated data into labeling projects
5. **Auto-annotation**: Pre-label data for faster training

#### **Training & Labeling Workflow**
1. **Import Data**: Upload text samples or use generated data
2. **Annotate PII**: Use interactive interface to label PII entities
3. **Quality Control**: Review annotations and track quality metrics  
4. **Export Training Data**: Export in multiple formats (HuggingFace, spaCy, etc.)
5. **Model Training**: Retrain detection models with new data

### Supported PII Types

#### **Personal Information**
- **Names**: First name, last name, full name
- **Contact Info**: Email addresses, phone numbers (international formats)
- **Addresses**: Street address, city, state, zipcode, country
- **Demographics**: Date of birth, age, gender

#### **Identification Numbers**
- **Government IDs**: Social Security Numbers (SSN), driver licenses, passport numbers
- **Financial**: Credit card numbers, bank account numbers, routing numbers  
- **Medical**: Medical record numbers, patient IDs
- **Employment**: Employee IDs, payroll numbers
- **Other**: IP addresses, usernames, passwords

#### **Generated Data Types** (23+ types for training)
```
name, first_name, last_name, email, phone, address, street_address, 
city, state, zipcode, country, ssn, credit_card, date_of_birth, 
driver_license, passport, ip_address, medical_record, employee_id, 
bank_account, company, job_title, username, password
```

### Multi-Language Support

#### **Detection Languages** (Pattern Matching + AI)
- **Korean** (한국어) - Native pattern support
- **English** - Comprehensive pattern library
- **Chinese** (中文) - Simplified and Traditional
- **Japanese** (日本語) - Hiragana, Katakana, Kanji
- **Spanish** (Español) - Regional variations
- **French** (Français) - European standard

#### **Data Generation Locales** (Faker-based)
- **English**: `en_US` - United States format
- **Spanish**: `es_ES` - Spain format  
- **French**: `fr_FR` - France format
- **German**: `de_DE` - Germany format
- **Italian**: `it_IT` - Italy format
- **Japanese**: `ja_JP` - Japan format
- **Chinese**: `zh_CN` - China format
- **Korean**: `ko_KR` - Korea format
- **Portuguese**: `pt_BR` - Brazil format
- **Dutch**: `nl_NL` - Netherlands format
- **Russian**: `ru_RU` - Russia format
- **Arabic**: `ar_SA` - Saudi Arabia format

#### **AI Model Language Support**
- **Multilingual BERT**: 104+ languages with automatic detection
- **DeBERTa v3**: Advanced multilingual understanding
- **Ollama LLM**: Context-aware analysis in multiple languages

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  Deep Search    │
│   React + TS    │◄──►│   Node.js + TS  │◄──►│   Engine        │
│   Port: 3000    │    │   Port: 3001    │    │  (Multi-AI)     │
└─────────────────┘    └─────────────────┘    │  Port: 8000     │
                                │              └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Context Search  │    │   AI Models     │
                       │ Python + LLM    │    │ BERT + DeBERTa  │
                       │ Port: 8001      │    │   + Ollama      │
                       └─────────────────┘    │  Port: 11434    │
                                │              └─────────────────┘
                                ▼              
                       ┌─────────────────┐    
                       │ Labeling System │    
                       │  React + Python │    
                       │  Port: 3002     │    
                       │  Port: 8002     │    
                       └─────────────────┘    
```

### Detection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Text Input                            │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Detection Router                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │   Basic     │ │   Simple    │ │  Cascaded   │ │   Context   ││
│  │   Search    │ │  Learning   │ │    AI       │ │   Search    ││
│  │  (Regex)    │ │   (ML)      │ │  (Parallel) │ │   (LLM)     ││
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘│
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cascaded AI Models                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│  │Multilingual │ │  DeBERTa    │ │   Ollama    │ ← Parallel     │
│  │    BERT     │ │     v3      │ │    LLM      │   Processing   │
│  │   (104+     │ │ (Advanced   │ │ (Context    │                │
│  │ languages)  │ │  Analysis)  │ │ Analysis)   │                │
│  └─────────────┘ └─────────────┘ └─────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│            Result Processing & Deduplication                   │
│  • Merge overlapping detections                                │
│  • Confidence scoring                                          │
│  • Model comparison                                            │
│  • Export options                                              │
└─────────────────────────────────────────────────────────────────┘
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

#### Deep Search Engine (Enhanced AI)
- **Python 3.8+** with FastAPI
- **Transformers** library for BERT/DeBERTa models
- **Multilingual BERT** (`bert-base-multilingual-cased`)
- **DeBERTa v3** (`microsoft/deberta-v3-base`)
- **scikit-learn** for simple ML models
- **PyTorch** for deep learning
- **Async processing** for parallel execution

#### Context Search Engine  
- **Python 3.8+** with FastAPI
- **Ollama** integration (`llama3.2:3b`)
- **Transformers** library
- **Async LLM processing**
- **Context-aware analysis**

#### Data Generation System
- **Faker** library for realistic data
- **rstr** for regex-based generation
- **23+ PII data types**
- **12+ language locales**
- **Template engine** for custom formats

#### Data Labeling System (Enhanced)
- **React** frontend with TypeScript
- **Python FastAPI** backend with SQLAlchemy
- **SQLite** database with migration support
- **Export formats**: HuggingFace, spaCy, CoNLL, JSON, CSV
- **Quality analytics**: Inter-annotator agreement metrics
- **Auto-annotation**: Pre-labeling for generated data
- **Bulk import/export** capabilities

## 📡 API Documentation

### Backend API Endpoints

#### Search Operations
```http
POST /api/search/basic
POST /api/search/deep
POST /api/search/context
Content-Type: application/json

{
  "text": "Hello, my name is John Doe",
  "languages": ["english"],
  "maxCharacters": 10000,
  "confidenceThreshold": 0.7
}
```

#### Health & Status
```http
GET /api/health
GET /api/status
```

### Deep Search Engine API (Enhanced)

#### Standard Search
```http
POST /search
Content-Type: application/json

{
  "text": "Sample text for analysis",
  "languages": ["english"],
  "confidence_threshold": 0.7
}
```

#### Parallel Cascaded Detection
```http
POST /search/separate-results
Content-Type: application/json

{
  "text": "Text to analyze",
  "languages": ["english"],
  "confidence_threshold": 0.7
}
```

#### Model Comparison
```http
POST /search/compare-models
Content-Type: application/json

{
  "text": "Compare results across models",
  "languages": ["english"]
}
```

#### Detection Control
```http
POST /detection/set-cascaded
Content-Type: application/json

{
  "enabled": true
}

GET /detection/status
```

### Data Generation API

#### Generate PII Data
```http
POST /data-generator/generate
Content-Type: application/json

{
  "type": "email",
  "count": 100,
  "locale": "en_US"
}

# Regex-based generation
{
  "regex": "\\d{3}-\\d{2}-\\d{4}",
  "count": 50
}

# Template-based generation
{
  "template": "Customer: {name}, Email: {email}",
  "count": 25
}
```

#### Bulk Import to Labeling
```http
POST /data-generator/bulk-import
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "project_id": "project-123",
  "generation_config": {
    "mixed_samples": true,
    "count": 100
  },
  "auto_annotate": true
}
```

#### Export Generated Data
```http
POST /data-generator/export
Content-Type: application/json

{
  "generation_config": {
    "type": "phone",
    "count": 1000
  },
  "export_format": "csv",
  "filename": "phone_numbers.csv"
}
```

#### Get Supported Types
```http
GET /data-generator/types
```

### Labeling System API

#### Project Management
```http
GET /projects
POST /projects
PUT /projects/{id}
DELETE /projects/{id}
```

#### Sample Management
```http
GET /projects/{project_id}/samples
POST /projects/{project_id}/samples
GET /samples/{id}
PUT /samples/{id}
```

#### Annotation Management
```http
GET /samples/{sample_id}/annotations
POST /samples/{sample_id}/annotations
PUT /annotations/{id}
DELETE /annotations/{id}
```

#### Export Training Data
```http
POST /projects/{project_id}/export
Content-Type: application/json

{
  "format": "huggingface",
  "quality_threshold": 0.8,
  "include_metadata": true
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