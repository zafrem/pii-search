# PII Data Labeling System

A comprehensive web-based labeling system with integrated data generation capabilities for creating high-quality training datasets. Features Faker-based PII data generation, advanced annotation tools, and seamless integration with AI detection models.

## 🎯 Overview

This advanced labeling system provides end-to-end solutions for PII detection training:

1. **Data Generation** - Faker-based realistic PII data creation with 23+ types
2. **Interactive Labeling** - Advanced annotation interface with quality control
3. **AI Integration** - Direct integration with Deep Search Engine models
4. **Export Pipeline** - Multiple training formats (HuggingFace, spaCy, CoNLL, JSON, CSV)

## ✨ Key Features

### 🎲 **Advanced Data Generation**
- **Faker Integration**: Realistic PII data using 23+ data types
- **Regex Pattern Support**: Generate data matching any regular expression
- **Template Engine**: Custom format generation with placeholders
- **12+ Language Locales**: Multi-language data generation
- **Bulk Generation**: Create thousands of training samples instantly
- **Auto-annotation**: Pre-label generated data for faster training

### 🏷️ **Professional Labeling Interface**
- **Character-level Precision**: Exact boundary marking
- **Visual Entity Highlighting**: Color-coded PII types
- **Keyboard Shortcuts**: Efficient annotation workflows
- **Real-time Validation**: Overlap detection and error prevention
- **Multi-format Export**: HuggingFace, spaCy, CoNLL, JSON, CSV
- **Progress Tracking**: Comprehensive project analytics

### 📊 **Quality Analytics & Control**
- **Inter-annotator Agreement**: Cohen's Kappa and consensus metrics
- **Quality Thresholds**: Configurable minimum quality requirements
- **Annotator Performance**: Individual and team performance tracking
- **Conflict Resolution**: Built-in disagreement resolution workflow
- **Audit Trail**: Complete history of all annotation changes

### 🤖 **AI Model Integration**
- **Direct Import**: Generate and import data directly to projects
- **Model Feedback**: Use AI predictions to improve labeling efficiency
- **Active Learning**: Identify difficult cases for manual review
- **Continuous Training**: Seamless pipeline to retrain models

## 🏗️ Enhanced Architecture

```
deep_search_labeling/
├── frontend/                    # React + TypeScript UI
│   ├── src/
│   │   ├── components/         # Advanced labeling components
│   │   │   ├── LabelingInterface.tsx
│   │   │   ├── DataGeneration.tsx
│   │   │   ├── QualityAnalytics.tsx
│   │   │   └── ProjectManagement.tsx
│   │   ├── services/           # API integration
│   │   │   ├── labelingService.ts
│   │   │   ├── generatorService.ts
│   │   │   └── analyticsService.ts
│   │   └── types/              # TypeScript definitions
│   └── package.json
├── backend/                     # FastAPI + SQLAlchemy
│   ├── src/
│   │   ├── api/main.py         # Enhanced API with generation
│   │   ├── data_generator.py   # Faker-based generation
│   │   ├── models/             # Database models & schemas
│   │   │   ├── database.py     # Enhanced data models
│   │   │   └── schemas.py      # Pydantic schemas
│   │   ├── database/           # Database management
│   │   │   └── connection.py   # SQLAlchemy setup
│   │   └── auth/               # Authentication system
│   │       └── auth.py         # JWT-based auth
│   ├── requirements.txt        # Enhanced dependencies
│   ├── alembic.ini            # Database migrations
│   └── start.py               # Application entry point
├── exports/                    # Generated training data
├── generated_data/            # Faker-generated samples
└── docs/                      # Documentation
    ├── API_GUIDE.md          # Complete API reference
    ├── LABELING_GUIDE.md     # Annotation guidelines
    └── GENERATOR_USAGE.md    # Data generation guide
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ and npm
- **Python** 3.8+
- **SQLite** (included with Python)

### Installation

#### Method 1: Automated Setup (Recommended)
```bash
# Clone and navigate
cd deep_search_labeling

# Run setup script
./setup.sh
```

#### Method 2: Manual Setup
```bash
# 1. Backend Setup
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

pip install -r requirements.txt
python -m alembic upgrade head

# 2. Frontend Setup  
cd ../frontend
npm install

# 3. Start Services
# Terminal 1 (Backend):
cd backend && python start.py

# Terminal 2 (Frontend):
cd frontend && npm start
```

### Access Points
- **Labeling Interface**: http://localhost:3002
- **API Documentation**: http://localhost:8002/docs
- **Swagger UI**: http://localhost:8002/redoc

## 📡 Enhanced API Documentation

### Data Generation Endpoints

#### Get Supported PII Types
```http
GET /data-generator/types
```

**Response:**
```json
{
  "success": true,
  "data": {
    "supported_types": [
      "name", "email", "phone", "address", "ssn", 
      "credit_card", "date_of_birth", "driver_license",
      "passport", "ip_address", "medical_record", 
      "employee_id", "bank_account", "company"
    ],
    "supported_locales": {
      "english": "en_US",
      "spanish": "es_ES", 
      "french": "fr_FR",
      "german": "de_DE"
    }
  }
}
```

#### Generate PII Data
```http
POST /data-generator/generate
Content-Type: application/json

{
  "type": "email",
  "count": 100,
  "locale": "en_US"
}
```

#### Regex-based Generation
```http
POST /data-generator/generate
Content-Type: application/json

{
  "regex": "\\d{3}-\\d{2}-\\d{4}",
  "count": 50
}
```

#### Template-based Generation
```http
POST /data-generator/generate
Content-Type: application/json

{
  "template": "Customer: {name}, Email: {email}, Phone: {phone}",
  "count": 25
}
```

#### Mixed Text Samples
```http
POST /data-generator/generate
Content-Type: application/json

{
  "mixed_samples": true,
  "count": 100
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "method": "mixed_samples",
    "count": 100,
    "records": [
      {
        "id": "uuid-123",
        "text": "Hello, my name is John Doe and my email is john@example.com",
        "annotations": [
          {
            "start": 18,
            "end": 26,
            "text": "John Doe",
            "type": "name",
            "classification": "pii",
            "confidence": 1.0
          }
        ]
      }
    ]
  }
}
```

#### Bulk Import to Project
```http
POST /data-generator/bulk-import
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "project_id": "project-123",
  "generation_config": {
    "mixed_samples": true,
    "count": 500,
    "locale": "en_US"
  },
  "auto_annotate": true
}
```

### Enhanced Labeling API

#### Project Management
```http
# Create project with generation settings
POST /projects
Content-Type: application/json

{
  "name": "PII Training Dataset v2.0",
  "description": "Enhanced dataset with generated samples",
  "guidelines": "Label all PII with high precision",
  "quality_threshold": 0.85,
  "generation_enabled": true
}

# Get project analytics
GET /projects/{id}/analytics

# Export project data
POST /projects/{id}/export
Content-Type: application/json

{
  "format": "huggingface",
  "quality_threshold": 0.8,
  "include_generated": true,
  "anonymize": false
}
```

#### Sample Management with Generation
```http
# Import generated samples
POST /projects/{project_id}/samples/generate
Content-Type: application/json

{
  "generation_config": {
    "type": "mixed_samples", 
    "count": 200
  },
  "auto_annotate": true
}

# Get sample with pre-annotations
GET /samples/{id}
```

#### Quality Analytics
```http
# Get inter-annotator agreement
GET /projects/{id}/quality-metrics

# Get annotator performance
GET /projects/{id}/annotator-performance

# Get annotation statistics
GET /projects/{id}/statistics
```

### Export Formats

#### HuggingFace Dataset Format
```http
POST /projects/{project_id}/export
Content-Type: application/json

{
  "format": "huggingface",
  "split_ratios": {
    "train": 0.8,
    "validation": 0.1,
    "test": 0.1
  }
}
```

#### spaCy Training Format
```http
POST /projects/{project_id}/export
Content-Type: application/json

{
  "format": "spacy",
  "include_ner": true,
  "include_patterns": true
}
```

#### CoNLL Format
```http
POST /projects/{project_id}/export
Content-Type: application/json

{
  "format": "conll",
  "bio_tagging": true,
  "include_confidence": true
}
```

## 🎯 Complete Workflow Examples

### 1. Generate Training Data Workflow
```bash
# 1. Create project
curl -X POST "http://localhost:8002/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Generated PII Dataset",
    "description": "Training data created with Faker"
  }'

# 2. Generate and import mixed samples
curl -X POST "http://localhost:8002/data-generator/bulk-import" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "project_id": "project-123",
    "generation_config": {
      "mixed_samples": true,
      "count": 1000
    },
    "auto_annotate": true
  }'

# 3. Export for training
curl -X POST "http://localhost:8002/projects/project-123/export" \
  -d '{
    "format": "huggingface",
    "quality_threshold": 0.9
  }'
```

### 2. Custom Pattern Generation
```bash
# Generate SSN patterns
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "regex": "\\d{3}-\\d{2}-\\d{4}",
    "count": 500
  }'

# Generate phone number variations
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "regex": "\\(\\d{3}\\)\\s\\d{3}-\\d{4}",
    "count": 300
  }'

# Generate custom employee records
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "template": "Employee {first_name} {last_name} (ID: {employee_id}) works at {company}",
    "count": 1000
  }'
```

### 3. Multi-language Dataset Creation
```bash
# Generate English data
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "mixed_samples": true,
    "count": 500,
    "locale": "en_US"
  }'

# Generate Spanish data  
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "mixed_samples": true,
    "count": 500,
    "locale": "es_ES"
  }'

# Generate German data
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "mixed_samples": true,
    "count": 500,
    "locale": "de_DE"
  }'
```

## 🛠️ Advanced Configuration

### Environment Variables
```env
# Backend Configuration (.env)
DATABASE_URL=sqlite:///./labeling.db
SECRET_KEY=your-secret-key-here
DEBUG=false

# Data Generation Settings
DEFAULT_LOCALE=en_US
MAX_GENERATION_COUNT=10000
ENABLE_AUTO_ANNOTATION=true

# Quality Control
MIN_INTER_ANNOTATOR_AGREEMENT=0.7
DEFAULT_QUALITY_THRESHOLD=0.8

# Export Settings
DEFAULT_EXPORT_FORMAT=huggingface
ENABLE_ANONYMIZATION=true
```

### Frontend Configuration
```typescript
// src/config/config.ts
export const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:8002',
  enableDataGeneration: true,
  defaultLocale: 'en_US',
  supportedFormats: ['huggingface', 'spacy', 'conll', 'json', 'csv'],
  qualityThresholds: {
    minimum: 0.7,
    recommended: 0.85,
    excellent: 0.95
  }
};
```

## 📊 Quality Analytics Dashboard

### Inter-annotator Agreement Metrics
```javascript
// Example analytics response
{
  "agreement_metrics": {
    "cohens_kappa": 0.87,
    "fleiss_kappa": 0.82,
    "percentage_agreement": 0.91,
    "entity_level_agreement": {
      "name": 0.95,
      "email": 0.98,
      "phone": 0.89,
      "address": 0.74
    }
  },
  "annotator_performance": {
    "annotator_1": {
      "samples_completed": 250,
      "avg_time_per_sample": 45.2,
      "quality_score": 0.92
    }
  }
}
```

### Project Statistics
```javascript
{
  "project_stats": {
    "total_samples": 5000,
    "completed_samples": 4200,
    "generated_samples": 3000,
    "manually_created": 2000,
    "entity_distribution": {
      "name": 1250,
      "email": 890,
      "phone": 760,
      "address": 450
    },
    "completion_rate": 0.84,
    "avg_entities_per_sample": 2.3
  }
}
```

## 🧪 Testing & Validation

### Data Quality Tests
```bash
# Run data validation
python -m pytest tests/test_data_quality.py

# Validate generated data
python tests/validate_generation.py

# Check annotation consistency  
python tests/check_annotation_quality.py
```

### API Testing
```bash
# Test generation endpoints
python -m pytest tests/test_generation_api.py

# Test labeling workflows
python -m pytest tests/test_labeling_api.py

# Integration tests
python -m pytest tests/test_integration.py
```

## 🚀 Production Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  labeling-backend:
    build: ./backend
    ports:
      - "8002:8002"
    environment:
      - DATABASE_URL=sqlite:///./data/labeling.db
    volumes:
      - ./data:/app/data
      - ./exports:/app/exports
      
  labeling-frontend:
    build: ./frontend
    ports:
      - "3002:3002"
    environment:
      - REACT_APP_API_URL=http://labeling-backend:8002
    depends_on:
      - labeling-backend
```

### Kubernetes Deployment
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: labeling-config
data:
  DATABASE_URL: "sqlite:///./data/labeling.db"
  ENABLE_DATA_GENERATION: "true"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: labeling-system
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: backend
        image: pii-labeling-backend:latest
        ports:
        - containerPort: 8002
        envFrom:
        - configMapRef:
            name: labeling-config
      - name: frontend
        image: pii-labeling-frontend:latest
        ports:
        - containerPort: 3002
```

## 💡 Best Practices

### Data Generation Strategy
1. **Start with Templates**: Use realistic templates for your domain
2. **Mix Generated and Real**: Combine synthetic and real data for best results
3. **Validate Patterns**: Test regex patterns before bulk generation
4. **Use Multiple Locales**: Generate diverse international data
5. **Balance Entity Types**: Ensure even distribution across PII types

### Annotation Guidelines
1. **Consistent Boundaries**: Always include complete entities
2. **Context Awareness**: Consider if information is truly identifying
3. **Quality Over Quantity**: Better to have fewer high-quality annotations
4. **Regular Calibration**: Periodic agreement checks between annotators
5. **Document Edge Cases**: Maintain guidelines for difficult scenarios

### Training Pipeline
1. **Quality Thresholds**: Set minimum agreement requirements
2. **Data Splits**: Use proper train/validation/test splits
3. **Export Validation**: Always validate exported data format
4. **Version Control**: Track dataset versions and changes
5. **Continuous Monitoring**: Track model performance on new data

## 📄 License

MIT License - see [LICENSE](../LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## 🙏 Acknowledgments

- **Faker** library for realistic data generation
- **React** and **TypeScript** for the frontend
- **FastAPI** for the backend API
- **SQLAlchemy** for database management
- **Material-UI** for component library