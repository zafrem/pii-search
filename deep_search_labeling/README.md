# PII Data Sub System - Labeling

A comprehensive web-based labeling system for creating high-quality training datasets for the Deep Search Engine. This system allows annotators to label PII entities in text data with precise boundaries and confidence scores.

## 🎯 Purpose

This labeling system creates training data for the Deep Search Engine by:
- **Manual annotation** of PII entities in text samples
- **Quality control** with multi-annotator consensus
- **Export functionality** to training-ready formats
- **Progress tracking** and annotation statistics
- **Integration** with Deep Search training pipeline

## 🏗️ Architecture

```
data_labeling/
├── frontend/           # React-based labeling interface
│   ├── src/
│   │   ├── components/    # Labeling UI components
│   │   ├── services/      # API integration
│   │   └── utils/         # Helper functions
│   └── public/
├── backend/            # FastAPI labeling server
│   ├── src/
│   │   ├── api/          # REST API endpoints
│   │   ├── models/       # Data models
│   │   ├── database/     # Database operations
│   │   └── export/       # Training data export
│   └── tests/
├── database/           # SQLite database and schemas
├── exports/            # Generated training datasets
└── docs/              # Documentation and guides
```

## 🚀 Features

### Core Labeling Features
- **📝 Text-based annotation** with character-level precision
- **🎨 Visual highlighting** of PII entities
- **🏷️ Multi-label support** (phone, email, name, address, etc.)
- **⚡ Keyboard shortcuts** for efficient labeling
- **🔄 Undo/redo** functionality
- **💾 Auto-save** progress

### Quality Control
- **👥 Multi-annotator workflow** with consensus scoring
- **📊 Inter-annotator agreement** metrics
- **🔍 Quality assurance** reviews
- **📈 Progress tracking** and statistics
- **⚠️ Conflict resolution** interface

### Data Management
- **📁 Project organization** with batches and sessions
- **🔒 User management** and role-based access
- **📋 Annotation guidelines** and examples
- **📤 Export formats** (CoNLL, JSON, CSV)
- **🔄 Version control** for labeled datasets

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI** for components
- **React Query** for state management
- **Zustand** for local state
- **React Router** for navigation

### Backend
- **FastAPI** with Python 3.8+
- **SQLite** database with SQLAlchemy ORM
- **Pydantic** for data validation
- **Alembic** for database migrations
- **JWT** authentication

### Export Integration
- **HuggingFace Datasets** format
- **spaCy training** format compatibility
- **PyTorch** dataset integration
- **Custom JSON** schemas

## 🔧 Setup Instructions

### 1. Backend Setup
```bash
cd data_labeling/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -m alembic upgrade head

# Start server (Port 8002)
python start.py
```

### 2. Frontend Setup
```bash
cd data_labeling/frontend

# Install dependencies
npm install

# Start development server (Port 3002)
npm start
```

### 3. Access the Application
- **Labeling Interface**: http://localhost:3002
- **API Documentation**: http://localhost:8002/docs
- **Admin Panel**: http://localhost:3002/admin

## 📋 Labeling Workflow

### 1. Project Setup
1. Create a new labeling project
2. Upload text samples for annotation
3. Configure PII entity types and guidelines
4. Assign annotators to the project

### 2. Annotation Process
1. **Load text sample** in the labeling interface
2. **Select text spans** containing PII entities
3. **Choose entity type** (name, email, phone, etc.)
4. **Set confidence level** (high/medium/low)
5. **Add notes** for complex cases
6. **Save and proceed** to next sample

### 3. Quality Control
1. **Review annotations** for consistency
2. **Resolve conflicts** between annotators
3. **Calculate agreement** metrics
4. **Approve final** labeled data

### 4. Export Training Data
1. **Select project** and quality thresholds
2. **Choose export format** (HuggingFace, spaCy, etc.)
3. **Generate training files** for Deep Search Engine
4. **Validate exported** data quality

## 🎨 Labeling Interface Features

### Text Annotation
- **Character-level selection** with mouse or keyboard
- **Entity type dropdown** with custom categories
- **Confidence scoring** (0.0 - 1.0)
- **Contextual information** display
- **Real-time validation** of overlapping entities

### Navigation
- **Sample navigation** with progress indicators
- **Search and filter** functionality
- **Bookmark difficult** cases
- **Batch operations** for efficiency

### Keyboard Shortcuts
- `Ctrl+S` - Save current annotation
- `Ctrl+Z` - Undo last action
- `Ctrl+Y` - Redo action
- `1-9` - Quick entity type selection
- `Space` - Next sample
- `Shift+Space` - Previous sample

## 📊 Annotation Guidelines

### PII Entity Types
1. **NAME** - Personal names (first, last, full)
2. **EMAIL** - Email addresses
3. **PHONE** - Phone numbers (mobile, landline)
4. **ADDRESS** - Physical addresses
5. **ID_NUMBER** - Social security, passport, etc.
6. **CREDIT_CARD** - Credit/debit card numbers
7. **ORGANIZATION** - Company, institution names
8. **DATE** - Birth dates, appointment dates
9. **POSTAL_CODE** - ZIP codes, postal codes

### Annotation Rules
- **Complete entities only** - Don't split names or addresses
- **Consistent boundaries** - Include titles, exclude punctuation
- **Context matters** - Consider if information is actually identifying
- **Mark uncertain cases** with lower confidence scores
- **Follow language-specific** naming conventions

## 🔄 Integration with Deep Search

### Training Data Pipeline
1. **Export labeled data** in HuggingFace format
2. **Validate data quality** with automated checks
3. **Split datasets** (train/validation/test)
4. **Configure training** parameters in Deep Search
5. **Monitor training** progress and metrics

### Continuous Improvement
- **Active learning** to identify difficult cases
- **Error analysis** from model predictions
- **Iterative labeling** of new data types
- **Model feedback** integration

## 📈 Analytics and Reporting

### Progress Tracking
- **Annotation velocity** per user
- **Quality metrics** and agreement scores
- **Project completion** status
- **Time estimation** for remaining work

### Quality Metrics
- **Inter-annotator agreement** (Cohen's Kappa)
- **Annotation consistency** across batches
- **Entity distribution** statistics
- **Difficulty assessment** per sample

## 🔒 Security and Privacy

- **Local deployment** - No external data sharing
- **User authentication** with role-based access
- **Audit logging** of all annotation actions
- **Data encryption** for sensitive samples
- **Anonymization tools** for public datasets

## 🚀 Getting Started

1. **Set up the environment** following setup instructions
2. **Create your first project** via the web interface
3. **Upload sample texts** for annotation
4. **Configure entity types** and guidelines
5. **Start labeling** and track your progress
6. **Export training data** when ready

This labeling system ensures high-quality training data for the Deep Search Engine while providing an efficient and user-friendly annotation experience.