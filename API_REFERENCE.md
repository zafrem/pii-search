# PII Search System - Complete API Reference

This document provides comprehensive API documentation for the entire PII Search system, including all components and their endpoints.

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Authentication](#authentication)
- [Backend API](#backend-api)
- [Deep Search Engine API](#deep-search-engine-api)
- [Context Search Engine API](#context-search-engine-api)
- [Data Generation API](#data-generation-api)
- [Labeling System API](#labeling-system-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## 🎯 System Overview

The PII Search system consists of multiple interconnected services:

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Backend | 3001 | Main API gateway |
| Deep Search Engine | 8000 | AI-powered PII detection |
| Context Search Engine | 8001 | LLM-based context analysis |
| Labeling System Backend | 8002 | Data annotation and generation |
| Labeling System Frontend | 3002 | Annotation interface |
| Ollama Server | 11434 | Local LLM server |

## 🔐 Authentication

### JWT Token Authentication
Most endpoints require JWT token authentication. Obtain tokens from the labeling system.

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### Using Authentication
Include the JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 🔧 Backend API (Port 3001)

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "services": {
    "deep_search": "healthy",
    "context_search": "healthy",
    "database": "connected"
  }
}
```

### Basic Search
```http
POST /api/search/basic
Content-Type: application/json

{
  "text": "Hello, my name is John Doe and my email is john@example.com",
  "languages": ["english"],
  "maxCharacters": 10000
}
```

**Response:**
```json
{
  "success": true,
  "stage": "basic",
  "results": [
    {
      "text": "John Doe",
      "type": "name",
      "confidence": 0.95,
      "position": {"start": 18, "end": 26},
      "language": "english"
    }
  ],
  "processingTime": 0.15,
  "metadata": {
    "method": "regex_patterns",
    "patterns_matched": ["name_pattern_en"]
  }
}
```

### Deep Search
```http
POST /api/search/deep
Content-Type: application/json

{
  "text": "Sample text for deep analysis",
  "languages": ["english"],
  "confidenceThreshold": 0.7,
  "stage1Results": {
    "results": [...],
    "processingTime": 0.15
  }
}
```

### Context Search
```http
POST /api/search/context
Content-Type: application/json

{
  "text": "Text for context analysis",
  "languages": ["english"],
  "previousResults": [
    {
      "text": "John Doe",
      "type": "name",
      "confidence": 0.95
    }
  ]
}
```

### System Status
```http
GET /api/status
```

**Response:**
```json
{
  "system": "PII Search System",
  "version": "2.0.0",
  "uptime": "2d 4h 32m",
  "services": {
    "frontend": {"status": "active", "url": "http://localhost:3000"},
    "backend": {"status": "active", "url": "http://localhost:3001"},
    "deep_search": {"status": "active", "url": "http://localhost:8000"},
    "context_search": {"status": "active", "url": "http://localhost:8001"},
    "labeling_system": {"status": "active", "url": "http://localhost:8002"}
  },
  "statistics": {
    "total_requests": 15420,
    "successful_detections": 12330,
    "average_response_time": "0.85s"
  }
}
```

## 🧠 Deep Search Engine API (Port 8000)

### Standard PII Detection
```http
POST /search
Content-Type: application/json

{
  "text": "Customer John Smith (ID: EMP12345) can be reached at john@company.com",
  "languages": ["english"],
  "confidence_threshold": 0.7
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stage": "deep_search",
    "method": "parallel-cascaded-detection",
    "items": [
      {
        "id": "uuid-123",
        "text": "John Smith",
        "type": "name",
        "classification": "pii",
        "language": "english",
        "position": {"start": 9, "end": 19},
        "probability": 0.95,
        "confidenceLevel": "high",
        "sources": ["multilingual-bert", "deberta-v3"],
        "context": "Customer John Smith (ID: EMP12345)"
      }
    ],
    "summary": {
      "totalItems": 3,
      "piiCount": 3,
      "nonPiiCount": 0,
      "highConfidence": 2,
      "mediumConfidence": 1
    },
    "processingTime": 0.45,
    "modelInfo": {
      "primary_model": "parallel-cascaded-detection",
      "models_used": ["multilingual-bert", "deberta-v3", "ollama-llm"],
      "model_summary": {
        "multilingual_bert": {"total_count": 2, "status": "success"},
        "deberta_v3": {"total_count": 3, "status": "success"},
        "ollama": {"total_count": 2, "status": "success"}
      }
    }
  }
}
```

### Separate Results Analysis
```http
POST /search/separate-results
Content-Type: application/json

{
  "text": "Contact Sarah Johnson at sarah@email.com or (555) 123-4567",
  "languages": ["english"],
  "confidence_threshold": 0.6
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stage": "deep_search",
    "method": "parallel-cascaded-detection",
    "separate_results": true,
    "model_details": {
      "english": {
        "type": "separate_results",
        "model_results": {
          "multilingual_bert": {
            "results": [
              {
                "id": "bert-1",
                "text": "Sarah Johnson",
                "type": "name",
                "probability": 0.92,
                "confidence_level": "high",
                "position": {"start": 8, "end": 21}
              }
            ],
            "count": 3,
            "status": "success"
          },
          "deberta_v3": {
            "results": [
              {
                "id": "deberta-1", 
                "text": "Sarah Johnson",
                "type": "person",
                "probability": 0.89,
                "confidence_level": "high"
              }
            ],
            "count": 2,
            "status": "success"
          },
          "ollama": {
            "results": [
              {
                "id": "ollama-1",
                "text": "Sarah Johnson",
                "type": "full_name",
                "probability": 0.94,
                "confidence_level": "high"
              }
            ],
            "count": 4,
            "status": "success"
          }
        },
        "total_items": 9
      }
    },
    "summary": {
      "total_items": 5,
      "models_compared": 3,
      "processing_time": 0.52
    }
  }
}
```

### Model Comparison
```http
POST /search/compare-models
Content-Type: application/json

{
  "text": "Employee Jane Doe (SSN: 123-45-6789) works at Tech Corp",
  "languages": ["english"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "comparison": {
      "english": {
        "multilingual_bert": {
          "count": 2,
          "items": [
            {
              "text": "Jane Doe",
              "type": "name",
              "probability": 0.96,
              "position": {"start": 9, "end": 17},
              "confidence_level": "high"
            }
          ],
          "status": "success"
        },
        "deberta_v3": {
          "count": 3,
          "items": [
            {
              "text": "Jane Doe",
              "type": "person_name",
              "probability": 0.94,
              "confidence_level": "high"
            }
          ],
          "status": "success"
        },
        "ollama": {
          "count": 4,
          "items": [
            {
              "text": "Jane Doe",
              "type": "full_name",
              "probability": 0.98,
              "confidence_level": "high"
            }
          ],
          "status": "success"
        }
      }
    },
    "summary": {
      "total_processing_time": 0.67,
      "languages_analyzed": ["english"],
      "models_compared": ["multilingual_bert", "deberta_v3", "ollama"],
      "text_length": 57
    }
  }
}
```

### Detection Control

#### Enable/Disable Cascaded Detection
```http
POST /detection/set-cascaded
Content-Type: application/json

{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cascaded detection enabled",
  "data": {
    "enabled": true,
    "timestamp": "2024-01-01T12:00:00Z"
  }
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
    "simple_engine_ready": true,
    "cascaded_detection_ready": true,
    "advanced_models_ready": true,
    "current_mode": "cascaded",
    "available_models": {
      "multilingual_bert": true,
      "deberta_v3": true,
      "ollama": true
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Training & Learning

#### Get Training Status
```http
GET /training/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "is_training": false,
    "last_training": "2024-01-01T10:00:00Z",
    "model_version": "v2.1",
    "training_samples": 15420,
    "model_performance": {
      "accuracy": 0.94,
      "precision": 0.92,
      "recall": 0.96,
      "f1_score": 0.94
    }
  }
}
```

#### Add Training Data
```http
POST /training/data
Content-Type: application/json

{
  "samples": [
    {
      "text": "Contact John at john@email.com for more information",
      "annotations": [
        {
          "start": 8,
          "end": 12,
          "text": "John",
          "label": "name",
          "confidence": 1.0
        },
        {
          "start": 16,
          "end": 32,
          "text": "john@email.com",
          "label": "email",
          "confidence": 1.0
        }
      ]
    }
  ]
}
```

#### List Models
```http
GET /models
```

**Response:**
```json
{
  "success": true,
  "data": {
    "active_models": [
      {
        "name": "multilingual-bert",
        "version": "bert-base-multilingual-cased",
        "status": "loaded",
        "languages": 104,
        "memory_usage": "1.2GB"
      },
      {
        "name": "deberta-v3", 
        "version": "microsoft/deberta-v3-base",
        "status": "loaded",
        "memory_usage": "1.8GB"
      }
    ],
    "model_cache": "/app/models/",
    "total_memory": "3.4GB"
  }
}
```

## 🤔 Context Search Engine API (Port 8001)

### Context Analysis
```http
POST /search
Content-Type: application/json

{
  "text": "Please send the report to Dr. Sarah Johnson at the medical center",
  "previousDetections": [
    {
      "text": "Dr. Sarah Johnson",
      "type": "name",
      "confidence": 0.95,
      "position": {"start": 26, "end": 42}
    }
  ],
  "language": "english"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stage": "context_search",
    "method": "ollama-llm-analysis", 
    "results": [
      {
        "id": "context-1",
        "text": "Dr. Sarah Johnson",
        "type": "name",
        "classification": "pii",
        "confidence": 0.97,
        "context_analysis": {
          "is_genuine_pii": true,
          "context_clues": ["professional title", "institutional setting"],
          "risk_level": "high",
          "reasoning": "Full name with professional title in healthcare context"
        },
        "position": {"start": 26, "end": 42},
        "enhanced_type": "healthcare_professional_name"
      }
    ],
    "context_summary": {
      "domain": "healthcare",
      "sensitivity_level": "high",
      "additional_context": "Medical/healthcare professional communication"
    },
    "processingTime": 1.25
  }
}
```

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "ollama_connection": "active",
  "model_loaded": "llama3.2:3b",
  "avg_response_time": "1.2s"
}
```

## 🎲 Data Generation API (Port 8002)

### Get Supported Types
```http
GET /data-generator/types
```

**Response:**
```json
{
  "success": true,
  "data": {
    "supported_types": [
      "name", "first_name", "last_name", "email", "phone", "address", 
      "street_address", "city", "state", "zipcode", "country", "ssn", 
      "credit_card", "date_of_birth", "driver_license", "passport", 
      "ip_address", "medical_record", "employee_id", "bank_account", 
      "company", "job_title", "username", "password"
    ],
    "supported_locales": {
      "english": "en_US",
      "spanish": "es_ES",
      "french": "fr_FR", 
      "german": "de_DE",
      "italian": "it_IT",
      "japanese": "ja_JP",
      "chinese": "zh_CN",
      "korean": "ko_KR",
      "portuguese": "pt_BR",
      "dutch": "nl_NL",
      "russian": "ru_RU",
      "arabic": "ar_SA"
    }
  }
}
```

### Generate PII Data

#### By Type
```http
POST /data-generator/generate
Content-Type: application/json

{
  "type": "email",
  "count": 100,
  "locale": "en_US",
  "format_template": "Contact: {email}"
}
```

#### By Regex Pattern
```http
POST /data-generator/generate
Content-Type: application/json

{
  "regex": "\\d{3}-\\d{2}-\\d{4}",
  "count": 50
}
```

#### By Template
```http
POST /data-generator/generate
Content-Type: application/json

{
  "template": "Employee: {first_name} {last_name}, ID: {employee_id}, Email: {email}",
  "count": 25
}
```

#### Mixed Samples
```http
POST /data-generator/generate
Content-Type: application/json

{
  "mixed_samples": true,
  "count": 100
}
```

**Unified Response Format:**
```json
{
  "success": true,
  "data": {
    "method": "type_email",
    "count": 100,
    "locale": "en_US",
    "records": [
      {
        "id": "gen-uuid-123",
        "type": "email",
        "value": "sarah.johnson@company.com",
        "generated_at": "2024-01-01T12:00:00Z",
        "locale": "en_US"
      }
    ]
  }
}
```

### Bulk Import to Projects
```http
POST /data-generator/bulk-import
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "project_id": "project-456",
  "generation_config": {
    "mixed_samples": true,
    "count": 500,
    "locale": "en_US"
  },
  "auto_annotate": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "project-456",
    "imported_count": 500,
    "method": "bulk_import",
    "auto_annotate": true,
    "samples": [
      {
        "sample_id": "sample-789",
        "text": "Customer John Doe can be reached at john@email.com",
        "annotations_count": 2
      }
    ]
  }
}
```

### Export Generated Data
```http
POST /data-generator/export
Content-Type: application/json

{
  "generation_config": {
    "type": "phone",
    "count": 1000,
    "locale": "en_US"
  },
  "export_format": "csv",
  "filename": "phone_numbers_dataset.csv"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filepath": "/exports/phone_numbers_dataset.csv",
    "format": "csv", 
    "record_count": 1000,
    "download_url": "/downloads/phone_numbers_dataset.csv"
  }
}
```

## 🏷️ Labeling System API (Port 8002)

### Authentication
```http
POST /auth/login
Content-Type: application/json

{
  "email": "annotator@example.com",
  "password": "secure_password"
}
```

### Project Management

#### List Projects
```http
GET /projects
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "proj-123",
      "name": "PII Training Dataset v2.0",
      "description": "Enhanced dataset with generated samples",
      "status": "active",
      "created_by": "user-456",
      "total_samples": 1000,
      "completed_samples": 750,
      "created_at": "2024-01-01T10:00:00Z",
      "quality_threshold": 0.85
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

#### Create Project
```http
POST /projects
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Medical PII Dataset",
  "description": "Healthcare-focused PII training data",
  "guidelines": "Label all medical PII with high precision",
  "quality_threshold": 0.9,
  "multi_annotator": true
}
```

#### Get Project Details
```http
GET /projects/{project_id}
Authorization: Bearer TOKEN
```

#### Project Analytics
```http
GET /projects/{project_id}/analytics
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "project_id": "proj-123",
    "total_samples": 1000,
    "completed_samples": 750,
    "total_entities": 2340,
    "unique_annotators": 5,
    "quality_metrics": {
      "inter_annotator_agreement": 0.87,
      "cohens_kappa": 0.82,
      "entity_distribution": {
        "name": 890,
        "email": 450,
        "phone": 320,
        "address": 680
      },
      "annotator_performance": {
        "ann-1": 0.94,
        "ann-2": 0.89,
        "ann-3": 0.92
      },
      "completion_rate": 0.75,
      "average_time": 45.2
    },
    "progress_over_time": [
      {
        "date": "2024-01-01",
        "completed": 100,
        "cumulative": 100
      }
    ]
  }
}
```

### Sample Management

#### List Samples
```http
GET /projects/{project_id}/samples
Authorization: Bearer TOKEN
Query Parameters:
  - page: Page number (default: 1)
  - limit: Items per page (default: 10)
  - status: Filter by status (pending, completed, etc.)
```

#### Create Sample
```http
POST /projects/{project_id}/samples
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "text": "Contact Dr. Smith at smith@hospital.com for appointment",
  "filename": "sample_001.txt",
  "language": "english"
}
```

#### Get Sample Details
```http
GET /samples/{sample_id}
Authorization: Bearer TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "sample-789",
    "text": "Contact Dr. Smith at smith@hospital.com for appointment",
    "project_id": "proj-123",
    "status": "completed",
    "language": "english",
    "filename": "sample_001.txt",
    "quality_score": 0.92,
    "created_at": "2024-01-01T10:00:00Z",
    "classifications": [
      {
        "id": "class-456",
        "start": 8,
        "end": 17,
        "text": "Dr. Smith",
        "classification": "pii",
        "confidence": 0.95,
        "notes": "Medical professional name",
        "annotator_id": "ann-1",
        "created_at": "2024-01-01T10:05:00Z"
      }
    ]
  }
}
```

### Annotation Management

#### Create Annotation
```http
POST /samples/{sample_id}/annotations
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "start": 8,
  "end": 17,
  "text": "Dr. Smith",
  "classification": "pii",
  "confidence": 0.95,
  "notes": "Healthcare professional name"
}
```

#### Update Annotation
```http
PUT /annotations/{annotation_id}
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "confidence": 0.98,
  "notes": "Updated confidence after review"
}
```

#### Delete Annotation
```http
DELETE /annotations/{annotation_id}
Authorization: Bearer TOKEN
```

### Export Training Data

#### Export Project
```http
POST /projects/{project_id}/export
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "format": "huggingface",
  "quality_threshold": 0.85,
  "include_metadata": true,
  "anonymize": false,
  "split_ratios": {
    "train": 0.8,
    "validation": 0.1,
    "test": 0.1
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "export_id": "export-123",
    "project_id": "proj-456", 
    "format": "huggingface",
    "status": "completed",
    "file_path": "/exports/proj-456_huggingface_20240101.zip",
    "download_url": "/downloads/proj-456_huggingface_20240101.zip",
    "created_at": "2024-01-01T12:00:00Z",
    "statistics": {
      "total_samples": 750,
      "total_entities": 2340,
      "train_samples": 600,
      "validation_samples": 75,
      "test_samples": 75
    }
  }
}
```

## ❌ Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "text",
      "reason": "Text exceeds maximum length"
    },
    "timestamp": "2024-01-01T12:00:00Z",
    "request_id": "req-uuid-123"
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `AUTHENTICATION_REQUIRED` | Missing or invalid token | 401 |
| `INSUFFICIENT_PERMISSIONS` | User lacks required permissions | 403 |
| `RESOURCE_NOT_FOUND` | Requested resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_SERVER_ERROR` | Server processing error | 500 |
| `SERVICE_UNAVAILABLE` | Service temporarily down | 503 |
| `MODEL_LOADING_ERROR` | AI model loading failed | 503 |
| `GENERATION_FAILED` | Data generation error | 422 |

## 🚦 Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 3600
```

### Rate Limits by Endpoint

| Endpoint Type | Rate Limit | Window |
|---------------|------------|--------|
| Health checks | 60/minute | 1 minute |
| Basic search | 30/minute | 1 minute |
| Deep search | 10/minute | 1 minute |
| Data generation | 5/minute | 1 minute |
| Bulk operations | 2/hour | 1 hour |
| Export operations | 1/hour | 1 hour |

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 45 seconds.",
    "details": {
      "limit": 10,
      "window": "1 minute",
      "reset_time": "2024-01-01T12:01:00Z"
    }
  }
}
```

## 📚 Complete Usage Examples

### Example 1: Full PII Detection Workflow
```bash
# 1. Basic pattern matching
curl -X POST "http://localhost:3001/api/search/basic" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contact Sarah Johnson at sarah@company.com or (555) 123-4567",
    "languages": ["english"]
  }'

# 2. Deep AI analysis
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contact Sarah Johnson at sarah@company.com or (555) 123-4567",
    "languages": ["english"],
    "confidence_threshold": 0.7
  }'

# 3. Context validation
curl -X POST "http://localhost:8001/search" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Contact Sarah Johnson at sarah@company.com or (555) 123-4567",
    "previousDetections": [
      {
        "text": "Sarah Johnson",
        "type": "name",
        "confidence": 0.95
      }
    ]
  }'
```

### Example 2: Training Data Generation Pipeline
```bash
# 1. Generate mixed training samples
curl -X POST "http://localhost:8002/data-generator/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "mixed_samples": true,
    "count": 1000,
    "locale": "en_US"
  }'

# 2. Create labeling project
curl -X POST "http://localhost:8002/projects" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Generated Training Dataset",
    "description": "AI training data with Faker-generated samples"
  }'

# 3. Bulk import generated data
curl -X POST "http://localhost:8002/data-generator/bulk-import" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "proj-123",
    "generation_config": {
      "mixed_samples": true,
      "count": 1000
    },
    "auto_annotate": true
  }'

# 4. Export for training
curl -X POST "http://localhost:8002/projects/proj-123/export" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "huggingface",
    "quality_threshold": 0.85
  }'
```

### Example 3: Model Comparison Analysis
```bash
# Compare all three AI models
curl -X POST "http://localhost:8000/search/compare-models" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Employee Jane Doe (SSN: 123-45-6789) works at Tech Corp Inc.",
    "languages": ["english"]
  }'

# Get separate results from each model
curl -X POST "http://localhost:8000/search/separate-results" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Employee Jane Doe (SSN: 123-45-6789) works at Tech Corp Inc.",
    "languages": ["english"],
    "confidence_threshold": 0.6
  }'
```

### Example 4: Custom Pattern Generation
```bash
# Generate SSN patterns
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "regex": "\\d{3}-\\d{2}-\\d{4}",
    "count": 500
  }'

# Generate phone variations
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "regex": "\\(\\d{3}\\)\\s\\d{3}-\\d{4}",
    "count": 300
  }'

# Generate custom templates
curl -X POST "http://localhost:8002/data-generator/generate" \
  -d '{
    "template": "Patient {name} (DOB: {date_of_birth}) has appointment with Dr. {last_name}",
    "count": 200
  }'
```

## 🔗 Integration Patterns

### Webhook Integration
```http
POST /webhooks/pii-detected
Content-Type: application/json
X-Signature: sha256=...

{
  "event": "pii_detected",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "detection_id": "det-123",
    "confidence": 0.95,
    "entities": [...]
  }
}
```

### Batch Processing
```http
POST /batch/detect
Content-Type: application/json

{
  "texts": [
    "Sample text 1 with John Doe",
    "Sample text 2 with jane@email.com",
    "Sample text 3 with (555) 123-4567"
  ],
  "config": {
    "languages": ["english"],
    "confidence_threshold": 0.7,
    "include_context": true
  }
}
```

This comprehensive API reference covers all aspects of the PII Search system. For additional examples, integration guides, and troubleshooting, refer to the individual component documentation files.