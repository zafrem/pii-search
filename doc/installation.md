# Installation Guide

## Prerequisites

- **Node.js** 16+ and npm
- **Python** 3.8+
- **Ollama** (for LLM functionality)
- **Docker** (optional, for containerized deployment)

## Local Development Setup

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

## Docker Deployment

### Core Services Only

```bash
# Build and start core services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### With Labeling System

```bash
# Start with labeling system
docker-compose --profile labeling up --build
```

### Production Deployment

```bash
# Production mode
./start-prod.sh

# Stop production
./stop-prod.sh
```

## Environment Configuration

Create `.env` files in respective directories:

### Backend `.env`
```env
NODE_ENV=development
PORT=3001
DEEP_SEARCH_URL=http://localhost:8000
CONTEXT_SEARCH_URL=http://localhost:8001
LOG_LEVEL=info
```

### Deep Search Engine `.env`
```env
HOST=0.0.0.0
PORT=8000
MODEL_PATH=./models/
LOG_LEVEL=info
```

### Context Search Engine `.env`
```env
HOST=0.0.0.0
PORT=8001
OLLAMA_HOST=http://localhost:11434
MODEL_NAME=llama3.2:3b
LOG_LEVEL=info
```