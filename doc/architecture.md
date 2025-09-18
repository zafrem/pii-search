# Architecture

## System Components

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

## Detection Architecture

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

## Technology Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Custom Hooks** for state management
- **Responsive Design** for all devices

### Backend
- **Node.js** with Express framework
- **TypeScript** for type safety
- **Winston** for logging
- **Helmet** for security headers
- **CORS** configuration

### Deep Search Engine (Enhanced AI)
- **Python 3.8+** with FastAPI
- **Transformers** library for BERT/DeBERTa models
- **Multilingual BERT** (`bert-base-multilingual-cased`)
- **DeBERTa v3** (`microsoft/deberta-v3-base`)
- **scikit-learn** for simple ML models
- **PyTorch** for deep learning
- **Async processing** for parallel execution

### Context Search Engine
- **Python 3.8+** with FastAPI
- **Ollama** integration (`llama3.2:3b`)
- **Transformers** library
- **Async LLM processing**
- **Context-aware analysis**

### Data Generation System
- **Faker** library for realistic data
- **rstr** for regex-based generation
- **23+ PII data types**
- **12+ language locales**
- **Template engine** for custom formats

### Data Labeling System (Enhanced)
- **React** frontend with TypeScript
- **Python FastAPI** backend with SQLAlchemy
- **SQLite** database with migration support
- **Export formats**: HuggingFace, spaCy, CoNLL, JSON, CSV
- **Quality analytics**: Inter-annotator agreement metrics
- **Auto-annotation**: Pre-labeling for generated data
- **Bulk import/export** capabilities