# PII Detection Learning Process Manual

This manual provides a comprehensive guide to the PII detection learning process, from deep search labeling through model training to deployment of the deep search engine.

## Table of Contents

1. [Overview](#overview)
2. [Deep Search Labeling](#deep-search-labeling)
3. [Training Process](#training-process)
4. [Deep Search Engine](#deep-search-engine)
5. [End-to-End Workflow](#end-to-end-workflow)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Overview

The PII detection system consists of three main components:

1. **Deep Search Labeling System**: Web-based tool for annotating text with PII entities
2. **Training Pipeline**: Process for converting labeled data into trained models
3. **Deep Search Engine**: System that uses trained models to detect PII in new text

This manual explains how these components work together to create an effective PII detection system.

## Deep Search Labeling

### Setup

1. Navigate to the deep search labeling directory:
   ```bash
   cd deep_search_labeling
   ```

2. Run the setup script:
   ```bash
   ./setup.sh
   ```

3. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate
   python start.py
   ```

4. Start the frontend server:
   ```bash
   cd ../frontend
   npm start
   ```

5. Access the labeling interface at http://localhost:3002

### Creating a Labeling Project

1. Log in to the labeling interface
2. Click "Create New Project"
3. Enter project details:
   - Project name
   - Description
   - Entity types to label (e.g., NAME, EMAIL, PHONE)
   - Upload text samples for annotation

### Annotation Process

1. Select a text sample from the project
2. Highlight text spans containing PII entities
3. Assign entity types to highlighted spans
4. Set confidence levels (0.0-1.0)
5. Add notes for complex cases
6. Save and move to the next sample

### Quality Control

1. Assign multiple annotators to the same project
2. Review inter-annotator agreement metrics
3. Resolve conflicts in the conflict resolution interface
4. Approve final annotations

### Exporting Labeled Data

1. Navigate to the "Export" tab
2. Select the project to export
3. Choose export format:
   - HuggingFace Datasets format (recommended)
   - spaCy training format
   - Custom JSON format
4. Set quality thresholds (e.g., minimum confidence score)
5. Generate and download the export file

## Training Process

### Preparing Training Data

1. Place exported data in the deep_search_engine/data directory:
   ```bash
   mkdir -p deep_search_engine/data/training
   cp deep_search_labeling/exports/your_export.json deep_search_engine/data/training/
   ```

2. Split the dataset into training, validation, and test sets:
   ```bash
   cd deep_search_engine
   python src/data_preparation.py --input data/training/your_export.json --split 0.7 0.15 0.15
   ```

### Configuring Training Parameters

1. Create or modify configuration file in `deep_search_engine/config`:
   ```bash
   cp config/training_config.example.json config/training_config.json
   ```

2. Edit the configuration file to set:
   - Model architecture
   - Training hyperparameters
   - Entity types
   - Language settings

### Running Training

1. Start the training process:
   ```bash
   cd deep_search_engine
   python src/train.py --config config/training_config.json
   ```

2. Monitor training progress:
   - Loss metrics
   - Entity recognition accuracy
   - F1 scores per entity type

3. Training outputs:
   - Trained model files in `deep_search_engine/models/`
   - Training logs in `deep_search_engine/logs/`
   - Evaluation metrics in `deep_search_engine/evaluation/`

## Deep Search Engine

### Setup

1. Navigate to the deep search directory:
   ```bash
   cd deep_search_engine
   ```

2. Run the setup script:
   ```bash
   ./setup.sh
   ```

3. Install required language models:
   ```bash
   python -m spacy download en_core_web_sm
   python -m spacy download ko_core_news_sm
   # Add other languages as needed
   ```

### Starting the Engine

1. Start the deep search API server:
   ```bash
   python start.py
   ```

2. The API will be available at http://localhost:8001

### API Endpoints

1. **Search Endpoint**
   - URL: `POST /search`
   - Purpose: Detect PII in provided text
   - Request body:
     ```json
     {
       "text": "Hello, my name is John Doe and my email is john@example.com",
       "model": "en_pii_detector",
       "confidence_threshold": 0.7
     }
     ```
   - Response:
     ```json
     {
       "entities": [
         {
           "text": "John Doe",
           "type": "NAME",
           "start": 18,
           "end": 26,
           "confidence": 0.95
         },
         {
           "text": "john@example.com",
           "type": "EMAIL",
           "start": 41,
           "end": 57,
           "confidence": 0.99
         }
       ]
     }
     ```

2. **Training Endpoint**
   - URL: `POST /train`
   - Purpose: Train or fine-tune models
   - Request body:
     ```json
     {
       "dataset_path": "data/training/your_export.json",
       "config_path": "config/training_config.json",
       "output_model_name": "custom_pii_detector"
     }
     ```

3. **Models Endpoint**
   - URL: `GET /models`
   - Purpose: List available models
   - Response:
     ```json
     {
       "models": [
         {
           "name": "en_pii_detector",
           "language": "en",
           "entity_types": ["NAME", "EMAIL", "PHONE", "ADDRESS"],
           "version": "1.0.0"
         }
       ]
     }
     ```

## End-to-End Workflow

### Step 1: Create Labeled Dataset
1. Set up the deep search labeling system
2. Create a new project
3. Annotate text samples with PII entities
4. Export labeled data in HuggingFace format

### Step 2: Train Model
1. Place exported data in deep_search_engine/data directory
2. Configure training parameters
3. Run the training process
4. Evaluate model performance

### Step 3: Deploy Model
1. Start the deep search engine
2. Use the API to detect PII in new text

### Step 4: Continuous Improvement
1. Identify misclassifications and edge cases
2. Create new labeled data for these cases
3. Retrain or fine-tune the model
4. Deploy the improved model

## Troubleshooting

### Deep Search Labeling Issues

- **Problem**: Annotators have low agreement scores
  - **Solution**: Review and clarify annotation guidelines

- **Problem**: Export fails
  - **Solution**: Check export format compatibility and file permissions

### Training Issues

- **Problem**: Training loss doesn't decrease
  - **Solution**: Adjust learning rate or batch size in training config

- **Problem**: Model has poor performance on certain entity types
  - **Solution**: Add more training examples for those entity types

### Deep Search Issues

- **Problem**: API returns 500 error
  - **Solution**: Check logs in `deep_search_engine/logs/` for details

- **Problem**: Low confidence scores for known entities
  - **Solution**: Fine-tune model with more examples of those entities

## Best Practices

### Deep Search Labeling
- Ensure consistent annotation guidelines
- Use multiple annotators for quality control
- Balance entity types in training data
- Include diverse text samples

### Training
- Use appropriate validation metrics
- Monitor for overfitting
- Start with pre-trained language models
- Experiment with different architectures

### Deployment
- Set appropriate confidence thresholds
- Implement feedback loops for continuous improvement
- Monitor model performance over time
- Version control your models

---

This manual provides a foundation for implementing the PII detection learning process. Adjust the steps as needed based on your specific requirements and infrastructure.
