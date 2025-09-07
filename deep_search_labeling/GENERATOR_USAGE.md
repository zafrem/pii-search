# PII Data Generator Usage Guide

The PII Data Generator is a comprehensive tool for creating realistic personal information data for training and testing PII detection models. It supports multiple generation methods and output formats.

## Features

### 🎯 **Generation Methods**
- **By Type**: Generate specific PII types (names, emails, phones, etc.)
- **By Regex**: Generate data matching custom regular expressions  
- **By Template**: Use templates with placeholders for complex formats
- **Mixed Samples**: Create realistic text samples with multiple PII types

### 🌍 **Multi-Language Support**
Supports 12+ locales: English, Spanish, French, German, Italian, Japanese, Chinese, Korean, Portuguese, Dutch, Russian, Arabic

### 📊 **Export Formats**
- **JSON**: Structured data with metadata
- **CSV**: Tabular format for analysis
- **Labeling**: Ready-to-import format for labeling system

## Supported PII Types

```
name, first_name, last_name, email, phone, address, street_address, 
city, state, zipcode, country, ssn, credit_card, date_of_birth, 
driver_license, passport, ip_address, medical_record, employee_id, 
bank_account, company, job_title, username, password
```

## Command Line Usage

### Basic Generation by Type
```bash
# Generate 50 email addresses
python data_generator.py --type email --count 50

# Generate 25 phone numbers in French locale
python data_generator.py --type phone --count 25 --locale fr_FR --format csv

# Generate names with custom format
python data_generator.py --type name --count 10 --format-template "Dr. {name}"
```

### Regex-Based Generation
```bash
# Generate Social Security Numbers
python data_generator.py --regex "\d{3}-\d{2}-\d{4}" --count 20

# Generate custom ID patterns
python data_generator.py --regex "ID-[A-Z]{2}-\d{6}" --count 15

# Generate phone number variations
python data_generator.py --regex "\(\d{3}\)\s\d{3}-\d{4}" --count 30
```

### Template-Based Generation
```bash
# Customer information template
python data_generator.py --template "Customer: {name}, Email: {email}, Phone: {phone}" --count 100

# Employee record template
python data_generator.py --template "Employee {employee_id}: {first_name} {last_name} works at {company}" --count 50

# Medical record template  
python data_generator.py --template "Patient {name} (DOB: {date_of_birth}) - MRN: {medical_record}" --count 25
```

### Mixed Text Samples
```bash
# Generate realistic text samples for labeling
python data_generator.py --mixed-samples --count 100 --format labeling

# Export to CSV for analysis
python data_generator.py --mixed-samples --count 200 --format csv
```

## API Usage

### Get Supported Types
```bash
curl -X GET "http://localhost:8002/data-generator/types"
```

### Generate PII Data
```bash
# Generate by type
curl -X POST "http://localhost:8002/data-generator/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "count": 50,
    "locale": "en_US"
  }'

# Generate by regex
curl -X POST "http://localhost:8002/data-generator/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "regex": "\\d{3}-\\d{2}-\\d{4}",
    "count": 25
  }'

# Generate by template
curl -X POST "http://localhost:8002/data-generator/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "Name: {name}, Email: {email}",
    "count": 30
  }'

# Generate mixed samples
curl -X POST "http://localhost:8002/data-generator/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "mixed_samples": true,
    "count": 100
  }'
```

### Bulk Import to Labeling Project
```bash
curl -X POST "http://localhost:8002/data-generator/bulk-import" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "project_id": "project-123",
    "generation_config": {
      "mixed_samples": true,
      "count": 100,
      "locale": "en_US"
    },
    "auto_annotate": true
  }'
```

### Export Generated Data
```bash
curl -X POST "http://localhost:8002/data-generator/export" \
  -H "Content-Type: application/json" \
  -d '{
    "generation_config": {
      "type": "email",
      "count": 1000
    },
    "export_format": "csv",
    "filename": "email_dataset.csv"
  }'
```

## Python API Usage

```python
from data_generator import PIIDataGenerator

# Initialize generator
generator = PIIDataGenerator('en_US')

# Generate by type
emails = generator.generate_by_type('email', count=100)

# Generate by regex pattern
ssns = generator.generate_by_regex(r'\d{3}-\d{2}-\d{4}', count=50)

# Generate by template
customer_records = generator.generate_by_template(
    "Customer: {name}, Phone: {phone}, Email: {email}", 
    count=200
)

# Generate mixed samples for labeling
text_samples = generator.generate_mixed_text_samples(count=500)

# Export data
generator.export_to_json(emails, 'emails.json')
generator.export_to_csv(customer_records, 'customers.csv')
generator.export_for_labeling_system(text_samples, 'labeling_data.json')
```

## Regex Pattern Examples

### Common PII Patterns
```bash
# Social Security Numbers
--regex "\d{3}-\d{2}-\d{4}"

# Phone Numbers (US)
--regex "\(\d{3}\)\s\d{3}-\d{4}"
--regex "\d{3}[-.]?\d{3}[-.]?\d{4}"

# Credit Card Numbers
--regex "\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}"

# Email Addresses
--regex "[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}"

# IP Addresses
--regex "\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"

# Driver License (varies by state)
--regex "[A-Z]{2}\d{7}"

# Medical Record Numbers
--regex "MRN\d{6,8}"

# Employee IDs
--regex "EMP\d{5}"

# Bank Account Numbers
--regex "\d{10,12}"

# Passport Numbers
--regex "\d{9}"

# Zip Codes
--regex "\d{5}(-\d{4})?"

# Dates (YYYY-MM-DD)
--regex "\d{4}-\d{2}-\d{2}"

# Custom License Plates
--regex "[A-Z]{3}-\d{4}"

# Insurance Policy Numbers
--regex "POL\d{8}"
```

## Template Examples

### Customer Records
```bash
--template "Customer ID: {employee_id}, Name: {name}, DOB: {date_of_birth}, Phone: {phone}"
```

### Medical Records
```bash
--template "Patient: {name} | MRN: {medical_record} | DOB: {date_of_birth} | Address: {address}"
```

### Employment Data
```bash  
--template "Employee: {first_name} {last_name} | ID: {employee_id} | Company: {company} | Title: {job_title} | Email: {email}"
```

### Financial Records
```bash
--template "Account Holder: {name} | Card: {credit_card} | Bank: {bank_account} | Address: {street_address}, {city}, {state}"
```

### Contact Information
```bash
--template "Contact: {name} | Phone: {phone} | Email: {email} | Company: {company} | Address: {address}"
```

## Output Formats

### JSON Format
```json
{
  "id": "uuid-string",
  "type": "email", 
  "value": "john.doe@example.com",
  "generated_at": "2024-01-01T12:00:00",
  "locale": "en_US"
}
```

### Mixed Sample Format
```json
{
  "id": "uuid-string",
  "text": "Hello, my name is John Doe and I can be reached at john@email.com or 555-123-4567.",
  "language": "english",
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
```

### Labeling System Format
```json
{
  "project": {
    "name": "Generated PII Data",
    "description": "Generated PII data for labeling"
  },
  "samples": [
    {
      "id": "sample-uuid",
      "text": "Customer John Doe can be reached at john@email.com",
      "pre_annotations": [...]
    }
  ]
}
```

## Tips and Best Practices

### 🎯 **For Training Data**
- Use mixed samples with 100-1000+ records
- Include multiple locales for diverse data
- Use templates that match your actual use cases
- Enable auto-annotation for pre-labeled data

### 🧪 **For Testing**
- Use regex patterns that match your validation rules
- Generate edge cases with specific templates
- Test with different locales and formats
- Export to CSV for analysis

### 🔒 **For Security Testing**  
- Generate realistic but fake sensitive data
- Use consistent formats that match production
- Include various PII combinations
- Export in formats your systems can ingest

### 📊 **For Analysis**
- Generate large datasets (1000+ records)
- Use multiple export formats
- Include metadata for tracking
- Test with real-world text patterns