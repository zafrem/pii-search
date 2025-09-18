# Usage Guide

## Detection Workflows

### Standard Detection Workflow
1. **Text Input**: Enter text (up to 10,000 characters) and select target languages
2. **Basic Search**: Rule-based pattern matching for immediate results
3. **Deep Search**: AI-powered detection with confidence scoring
4. **Context Search**: LLM validation for final verification

### Advanced AI Workflow
1. **Parallel Detection**: All three AI models (BERT, DeBERTa, Ollama) run simultaneously
2. **Combined Results**: Merged and deduplicated findings across all models
3. **Separate Analysis**: View individual model results for comparison
4. **Model Performance**: Compare accuracy and coverage across models

### Data Generation Workflow
1. **Generate Training Data**: Create realistic PII data using Faker
2. **Regex Generation**: Generate data matching custom patterns
3. **Template Generation**: Use custom templates with placeholders
4. **Bulk Import**: Import generated data into labeling projects
5. **Auto-annotation**: Pre-label data for faster training

### Training & Labeling Workflow
1. **Import Data**: Upload text samples or use generated data
2. **Annotate PII**: Use interactive interface to label PII entities
3. **Quality Control**: Review annotations and track quality metrics
4. **Export Training Data**: Export in multiple formats (HuggingFace, spaCy, etc.)
5. **Model Training**: Retrain detection models with new data

## Supported PII Types

### Personal Information
- **Names**: First name, last name, full name
- **Contact Info**: Email addresses, phone numbers (international formats)
- **Addresses**: Street address, city, state, zipcode, country
- **Demographics**: Date of birth, age, gender

### Identification Numbers
- **Government IDs**: Social Security Numbers (SSN), driver licenses, passport numbers
- **Financial**: Credit card numbers, bank account numbers, routing numbers
- **Medical**: Medical record numbers, patient IDs
- **Employment**: Employee IDs, payroll numbers
- **Other**: IP addresses, usernames, passwords

### Generated Data Types (23+ types for training)
```
name, first_name, last_name, email, phone, address, street_address,
city, state, zipcode, country, ssn, credit_card, date_of_birth,
driver_license, passport, ip_address, medical_record, employee_id,
bank_account, company, job_title, username, password
```

## Multi-Language Support

### Detection Languages (Pattern Matching + AI)
- **Korean** (한국어) - Native pattern support
- **English** - Comprehensive pattern library
- **Chinese** (中文) - Simplified and Traditional
- **Japanese** (日本語) - Hiragana, Katakana, Kanji
- **Spanish** (Español) - Regional variations
- **French** (Français) - European standard

### Data Generation Locales (Faker-based)
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

### AI Model Language Support
- **Multilingual BERT**: 104+ languages with automatic detection
- **DeBERTa v3**: Advanced multilingual understanding
- **Ollama LLM**: Context-aware analysis in multiple languages