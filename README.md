# PII Search

A multi-language PII detection system with 3-stage sequential execution using rule-based matching, ML binary classification, and LLM-powered context analysis.

## Overview

This application provides progressive PII detection with three specialized stages:
1. **Basic Search** - Rule-based pattern matching 
2. **Deep Search** - ML binary classification with sentence-level processing
3. **Context Search** - LLM-powered context validation using Ollama

### Key Features
- Multi-language support (Korean, English, Chinese, Japanese, Spanish, French)
- Sequential 3-stage processing with accumulated results
- Interactive sentence selection and labeling system
- Local processing for privacy (no external API calls)
- Real-time feedback with confidence scoring

## Demo
![Demo](./image/PII_Search.gif)

## Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- Ollama (for LLM functionality)

### Installation & Setup

```bash
# 1. Install dependencies
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 2. Setup Python engines
cd deep_search_engine && ./setup.sh && cd ..
cd context_search && ./setup.sh && cd ..

# 3. Install Ollama and models
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b
```

### Running the Application

```bash
# Start main application (frontend + backend)
npm run dev

# In separate terminals, start Python engines:
cd deep_search_engine && source venv/bin/activate && python start.py
cd context_search && source venv/bin/activate && python start.py
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Deep Search: http://localhost:8000
- Context Search: http://localhost:8001

### Basic Usage

1. **Text Input**: Enter text (up to 10,000 characters) and select languages
2. **Stage 1**: Click "Start Basic Search" for rule-based detection
3. **Stage 2**: Click "Continue to Deep Search" for ML classification
4. **Stage 3**: Click "Continue to Context Search" for LLM analysis

Results are displayed cumulatively with interactive sentence selection for the labeling system.

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Stage 1**: Rule-based regex pattern matching
- **Stage 2**: Python + scikit-learn (TF-IDF + Logistic Regression) + FastAPI
- **Stage 3**: Python + Ollama LLMs + FastAPI

## Security & Privacy

- **Local processing only** - No external API calls
- **No data retention** - Text not stored server-side
- **Input validation** and rate limiting
- **HTTPS ready** with security headers

## License

MIT License