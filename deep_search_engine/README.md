# Deep Search Engine

A deep learning-based PII detection engine that provides binary ML Classification (PII/non-PII) and context-aware detection capabilities.

## Features

- Multi-language binary ML Classification models (PII/non-PII)
- Context-aware PII detection
- Probability scoring
- Model training and fine-tuning
- RESTful API interface

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Download language models:
```bash
python -m spacy download en_core_web_sm
python -m spacy download ko_core_news_sm
python -m spacy download zh_core_web_sm
python -m spacy download ja_core_news_sm
python -m spacy download es_core_news_sm
python -m spacy download fr_core_news_sm
```

3. Start the API server:
```bash
python src/api.py
```

## Architecture

- `src/` - Core engine implementation
- `models/` - Trained model files
- `data/` - Training and test datasets
- `config/` - Configuration files
- `tests/` - Unit tests

## API Endpoints

- `POST /search` - Perform deep PII search
- `POST /train` - Train/fine-tune models
- `GET /health` - Health check
- `GET /models` - List available models