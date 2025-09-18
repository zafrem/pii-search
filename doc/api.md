# API Documentation

## Backend API Endpoints

### Search Operations
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

### Health & Status
```http
GET /api/health
GET /api/status
```

## Deep Search Engine API (Enhanced)

### Standard Search
```http
POST /search
Content-Type: application/json

{
  "text": "Sample text for analysis",
  "languages": ["english"],
  "confidence_threshold": 0.7
}
```

### Parallel Cascaded Detection
```http
POST /search/separate-results
Content-Type: application/json

{
  "text": "Text to analyze",
  "languages": ["english"],
  "confidence_threshold": 0.7
}
```

### Model Comparison
```http
POST /search/compare-models
Content-Type: application/json

{
  "text": "Compare results across models",
  "languages": ["english"]
}
```

### Detection Control
```http
POST /detection/set-cascaded
Content-Type: application/json

{
  "enabled": true
}

GET /detection/status
```

## Data Generation API

### Generate PII Data
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

### Bulk Import to Labeling
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

### Export Generated Data
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

### Get Supported Types
```http
GET /data-generator/types
```

## Labeling System API

### Project Management
```http
GET /projects
POST /projects
PUT /projects/{id}
DELETE /projects/{id}
```

### Sample Management
```http
GET /projects/{project_id}/samples
POST /projects/{project_id}/samples
GET /samples/{id}
PUT /samples/{id}
```

### Annotation Management
```http
GET /samples/{sample_id}/annotations
POST /samples/{sample_id}/annotations
PUT /annotations/{id}
DELETE /annotations/{id}
```

### Export Training Data
```http
POST /projects/{project_id}/export
Content-Type: application/json

{
  "format": "huggingface",
  "quality_threshold": 0.8,
  "include_metadata": true
}
```