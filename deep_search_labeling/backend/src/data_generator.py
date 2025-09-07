"""
Faker-based Personal Information Data Generator for PII Labeling System

This script generates realistic personal information using Faker library with support for:
- Multiple PII types (names, emails, phones, addresses, SSN, credit cards, etc.)
- Custom formats and templates
- Regex-based pattern generation
- Multiple languages/locales
- Configurable record counts
- Export to various formats (JSON, CSV, text samples for labeling)

Usage:
    python data_generator.py --type email --count 100 --format json
    python data_generator.py --regex "\\d{3}-\\d{2}-\\d{4}" --count 50
    python data_generator.py --template "My name is {name} and I live at {address}" --count 25
"""

import argparse
import json
import csv
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
import random

try:
    from faker import Faker
    from faker.providers import BaseProvider
except ImportError:
    print("Faker not installed. Installing...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "faker"])
    from faker import Faker
    from faker.providers import BaseProvider

try:
    import rstr  # For regex-based string generation
except ImportError:
    print("rstr not installed. Installing for regex generation...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "rstr"])
    import rstr

# Custom provider for additional PII types
class PIIProvider(BaseProvider):
    """Custom Faker provider for PII-specific data types"""
    
    def ssn(self) -> str:
        """Generate Social Security Number"""
        return f"{self.random_int(100, 999)}-{self.random_int(10, 99)}-{self.random_int(1000, 9999)}"
    
    def driver_license(self) -> str:
        """Generate Driver License Number"""
        return f"{self.random_element(['DL', 'DR', 'LIC'])}{self.random_int(1000000, 9999999)}"
    
    def passport_number(self) -> str:
        """Generate Passport Number"""
        return f"{self.random_int(100000000, 999999999)}"
    
    def ip_address_v4(self) -> str:
        """Generate IPv4 address"""
        return f"{self.random_int(1, 255)}.{self.random_int(0, 255)}.{self.random_int(0, 255)}.{self.random_int(1, 255)}"
    
    def medical_record_number(self) -> str:
        """Generate Medical Record Number"""
        return f"MRN{self.random_int(100000, 999999)}"
    
    def employee_id(self) -> str:
        """Generate Employee ID"""
        return f"EMP{self.random_int(10000, 99999)}"
    
    def bank_routing_number(self) -> str:
        """Generate Bank Routing Number"""
        return f"{self.random_int(100000000, 999999999)}"

class PIIDataGenerator:
    """Main class for generating PII data using Faker"""
    
    # Supported PII types and their Faker methods
    PII_TYPES = {
        'name': lambda f: f.name(),
        'first_name': lambda f: f.first_name(),
        'last_name': lambda f: f.last_name(),
        'email': lambda f: f.email(),
        'phone': lambda f: f.phone_number(),
        'address': lambda f: f.address(),
        'street_address': lambda f: f.street_address(),
        'city': lambda f: f.city(),
        'state': lambda f: f.state(),
        'zipcode': lambda f: f.zipcode(),
        'country': lambda f: f.country(),
        'ssn': lambda f: f.ssn(),
        'credit_card': lambda f: f.credit_card_number(),
        'date_of_birth': lambda f: f.date_of_birth().strftime('%Y-%m-%d'),
        'driver_license': lambda f: f.driver_license(),
        'passport': lambda f: f.passport_number(),
        'ip_address': lambda f: f.ip_address_v4(),
        'medical_record': lambda f: f.medical_record_number(),
        'employee_id': lambda f: f.employee_id(),
        'bank_account': lambda f: f.bank_routing_number(),
        'company': lambda f: f.company(),
        'job_title': lambda f: f.job(),
        'username': lambda f: f.user_name(),
        'password': lambda f: f.password(),
    }
    
    # Supported locales for different languages/regions
    LOCALES = {
        'english': 'en_US',
        'spanish': 'es_ES',
        'french': 'fr_FR',
        'german': 'de_DE',
        'italian': 'it_IT',
        'japanese': 'ja_JP',
        'chinese': 'zh_CN',
        'korean': 'ko_KR',
        'portuguese': 'pt_BR',
        'dutch': 'nl_NL',
        'russian': 'ru_RU',
        'arabic': 'ar_SA',
    }
    
    def __init__(self, locale: str = 'en_US'):
        """Initialize the generator with specified locale"""
        self.faker = Faker(locale)
        self.faker.add_provider(PIIProvider)
    
    def generate_by_type(self, pii_type: str, count: int = 1, format_template: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Generate PII data by type
        
        Args:
            pii_type: Type of PII to generate (e.g., 'name', 'email', 'phone')
            count: Number of records to generate
            format_template: Optional custom format template
            
        Returns:
            List of generated data records
        """
        if pii_type not in self.PII_TYPES:
            raise ValueError(f"Unsupported PII type: {pii_type}. Supported types: {list(self.PII_TYPES.keys())}")
        
        generator_func = self.PII_TYPES[pii_type]
        results = []
        
        for i in range(count):
            value = generator_func(self.faker)
            
            if format_template:
                # Apply custom formatting if provided
                formatted_value = self._apply_format_template(format_template, {pii_type: value})
                value = formatted_value
            
            record = {
                'id': str(uuid.uuid4()),
                'type': pii_type,
                'value': value,
                'generated_at': datetime.now().isoformat(),
                'locale': str(self.faker.locales[0]) if self.faker.locales else 'en_US'
            }
            results.append(record)
        
        return results
    
    def generate_by_regex(self, pattern: str, count: int = 1) -> List[Dict[str, Any]]:
        """
        Generate data matching a regular expression pattern
        
        Args:
            pattern: Regular expression pattern to match
            count: Number of records to generate
            
        Returns:
            List of generated data records matching the pattern
        """
        results = []
        
        for i in range(count):
            try:
                value = rstr.xeger(pattern)
                record = {
                    'id': str(uuid.uuid4()),
                    'type': 'regex_pattern',
                    'value': value,
                    'pattern': pattern,
                    'generated_at': datetime.now().isoformat(),
                    'locale': str(self.faker.locales[0]) if self.faker.locales else 'en_US'
                }
                results.append(record)
            except Exception as e:
                print(f"Error generating data for pattern '{pattern}': {e}")
                continue
        
        return results
    
    def generate_by_template(self, template: str, count: int = 1) -> List[Dict[str, Any]]:
        """
        Generate data using a template with placeholder fields
        
        Args:
            template: Template string with placeholders like "My name is {name} and email is {email}"
            count: Number of records to generate
            
        Returns:
            List of generated data records
        """
        # Extract placeholders from template
        placeholders = re.findall(r'\{(\w+)\}', template)
        unsupported_types = [p for p in placeholders if p not in self.PII_TYPES]
        
        if unsupported_types:
            raise ValueError(f"Unsupported PII types in template: {unsupported_types}")
        
        results = []
        
        for i in range(count):
            # Generate values for all placeholders
            values = {}
            for placeholder in placeholders:
                generator_func = self.PII_TYPES[placeholder]
                values[placeholder] = generator_func(self.faker)
            
            # Fill template
            filled_template = template.format(**values)
            
            record = {
                'id': str(uuid.uuid4()),
                'type': 'template',
                'value': filled_template,
                'template': template,
                'components': values,
                'generated_at': datetime.now().isoformat(),
                'locale': str(self.faker.locales[0]) if self.faker.locales else 'en_US'
            }
            results.append(record)
        
        return results
    
    def generate_mixed_text_samples(self, count: int = 1, min_pii_per_sample: int = 1, max_pii_per_sample: int = 3) -> List[Dict[str, Any]]:
        """
        Generate mixed text samples with both PII and non-PII content for labeling
        
        Args:
            count: Number of text samples to generate
            min_pii_per_sample: Minimum number of PII items per sample
            max_pii_per_sample: Maximum number of PII items per sample
            
        Returns:
            List of text samples with PII annotations
        """
        templates = [
            "Hello, my name is {name} and I can be reached at {email} or {phone}.",
            "Please send the documents to {name} at {address}. Their SSN is {ssn}.",
            "Customer {name} (ID: {employee_id}) lives in {city}, {state} {zipcode}.",
            "Dr. {name} can be contacted at {phone}. Office address: {street_address}.",
            "Account holder: {name}, DOB: {date_of_birth}, Card: {credit_card}",
            "Employee {first_name} {last_name} works at {company} as {job_title}. Email: {email}",
            "Patient {name} (MRN: {medical_record}) resides at {address}. Phone: {phone}",
            "User {username} registered with email {email} from IP {ip_address}",
            "Contact: {name}, Phone: {phone}, Company: {company}, Address: {street_address}, {city}",
            "Dear {name}, your appointment is scheduled. Please call {phone} to confirm."
        ]
        
        results = []
        
        for i in range(count):
            # Select random template
            template = random.choice(templates)
            
            # Extract placeholders
            placeholders = re.findall(r'\{(\w+)\}', template)
            
            # Generate values and track PII positions
            values = {}
            pii_annotations = []
            
            for placeholder in placeholders:
                if placeholder in self.PII_TYPES:
                    generator_func = self.PII_TYPES[placeholder]
                    values[placeholder] = generator_func(self.faker)
            
            # Fill template
            filled_text = template.format(**values)
            
            # Find PII positions in the filled text
            for placeholder, value in values.items():
                start_pos = filled_text.find(str(value))
                if start_pos != -1:
                    end_pos = start_pos + len(str(value))
                    pii_annotations.append({
                        'start': start_pos,
                        'end': end_pos,
                        'text': str(value),
                        'type': placeholder,
                        'classification': 'pii',
                        'confidence': 1.0
                    })
            
            record = {
                'id': str(uuid.uuid4()),
                'text': filled_text,
                'language': 'english',
                'annotations': pii_annotations,
                'template_used': template,
                'generated_at': datetime.now().isoformat(),
                'locale': str(self.faker.locales[0]) if self.faker.locales else 'en_US'
            }
            results.append(record)
        
        return results
    
    def _apply_format_template(self, template: str, values: Dict[str, Any]) -> str:
        """Apply custom format template to generated values"""
        try:
            return template.format(**values)
        except KeyError as e:
            raise ValueError(f"Template contains unsupported placeholder: {e}")
    
    def export_to_json(self, data: List[Dict[str, Any]], filename: str) -> str:
        """Export data to JSON file"""
        filepath = Path(filename)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        return str(filepath)
    
    def export_to_csv(self, data: List[Dict[str, Any]], filename: str) -> str:
        """Export data to CSV file"""
        if not data:
            raise ValueError("No data to export")
        
        filepath = Path(filename)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        # Flatten nested dictionaries for CSV export
        flattened_data = []
        for record in data:
            flat_record = {}
            for key, value in record.items():
                if isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        flat_record[f"{key}_{sub_key}"] = sub_value
                elif isinstance(value, list):
                    flat_record[key] = json.dumps(value)
                else:
                    flat_record[key] = value
            flattened_data.append(flat_record)
        
        fieldnames = flattened_data[0].keys()
        
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(flattened_data)
        
        return str(filepath)
    
    def export_for_labeling_system(self, data: List[Dict[str, Any]], filename: str, project_name: str = "Generated Data") -> str:
        """
        Export data in format suitable for the labeling system
        
        Args:
            data: Generated data
            filename: Output filename
            project_name: Name of the labeling project
            
        Returns:
            Path to exported file
        """
        labeling_format = {
            'project': {
                'name': project_name,
                'description': 'Generated PII data for labeling',
                'created_at': datetime.now().isoformat(),
                'guidelines': 'Label all personally identifiable information (PII) in the text samples.'
            },
            'samples': []
        }
        
        for record in data:
            if 'text' in record and 'annotations' in record:
                # Mixed text sample format
                sample = {
                    'id': record['id'],
                    'text': record['text'],
                    'language': record.get('language', 'english'),
                    'filename': f"generated_{record['id'][:8]}.txt",
                    'pre_annotations': record['annotations']
                }
            else:
                # Simple value format - create text sample
                sample = {
                    'id': record['id'],
                    'text': f"The {record['type']} is: {record['value']}",
                    'language': record.get('locale', 'english'),
                    'filename': f"generated_{record['id'][:8]}.txt",
                    'pre_annotations': [{
                        'start': len(f"The {record['type']} is: "),
                        'end': len(f"The {record['type']} is: ") + len(str(record['value'])),
                        'text': str(record['value']),
                        'type': record['type'],
                        'classification': 'pii',
                        'confidence': 1.0
                    }]
                }
            
            labeling_format['samples'].append(sample)
        
        return self.export_to_json(labeling_format, filename)

def main():
    """Command-line interface for the PII data generator"""
    parser = argparse.ArgumentParser(description='Generate PII data using Faker')
    
    # Generation mode
    mode_group = parser.add_mutually_exclusive_group(required=True)
    mode_group.add_argument('--type', help='PII type to generate', 
                           choices=list(PIIDataGenerator.PII_TYPES.keys()))
    mode_group.add_argument('--regex', help='Regular expression pattern to match')
    mode_group.add_argument('--template', help='Template with placeholders (e.g., "Name: {name}, Email: {email}")')
    mode_group.add_argument('--mixed-samples', action='store_true', 
                           help='Generate mixed text samples for labeling')
    
    # Common arguments
    parser.add_argument('--count', type=int, default=10, help='Number of records to generate')
    parser.add_argument('--locale', default='en_US', help='Locale for data generation',
                       choices=list(PIIDataGenerator.LOCALES.values()))
    parser.add_argument('--format', default='json', choices=['json', 'csv', 'labeling'],
                       help='Output format')
    parser.add_argument('--output', help='Output filename (auto-generated if not provided)')
    parser.add_argument('--project-name', default='Generated PII Data',
                       help='Project name for labeling system export')
    
    # Template-specific arguments
    parser.add_argument('--format-template', help='Custom format template for single type generation')
    
    args = parser.parse_args()
    
    # Initialize generator
    generator = PIIDataGenerator(args.locale)
    
    # Generate data based on mode
    if args.type:
        print(f"Generating {args.count} {args.type} records...")
        data = generator.generate_by_type(args.type, args.count, args.format_template)
    elif args.regex:
        print(f"Generating {args.count} records matching pattern: {args.regex}")
        data = generator.generate_by_regex(args.regex, args.count)
    elif args.template:
        print(f"Generating {args.count} records using template: {args.template}")
        data = generator.generate_by_template(args.template, args.count)
    elif args.mixed_samples:
        print(f"Generating {args.count} mixed text samples...")
        data = generator.generate_mixed_text_samples(args.count)
    
    # Determine output filename
    if args.output:
        output_file = args.output
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if args.type:
            base_name = f"generated_{args.type}_{timestamp}"
        elif args.regex:
            base_name = f"generated_regex_{timestamp}"
        elif args.template:
            base_name = f"generated_template_{timestamp}"
        else:
            base_name = f"generated_mixed_{timestamp}"
        
        if args.format == 'json':
            output_file = f"{base_name}.json"
        elif args.format == 'csv':
            output_file = f"{base_name}.csv"
        else:
            output_file = f"{base_name}_labeling.json"
    
    # Export data
    try:
        if args.format == 'json':
            filepath = generator.export_to_json(data, output_file)
        elif args.format == 'csv':
            filepath = generator.export_to_csv(data, output_file)
        elif args.format == 'labeling':
            filepath = generator.export_for_labeling_system(data, output_file, args.project_name)
        
        print(f"✅ Generated {len(data)} records and exported to: {filepath}")
        
        # Show sample data
        if data:
            print(f"\nSample record:")
            sample = data[0]
            for key, value in sample.items():
                if isinstance(value, (dict, list)):
                    print(f"  {key}: {json.dumps(value, indent=2)}")
                else:
                    print(f"  {key}: {value}")
    
    except Exception as e:
        print(f"❌ Error generating data: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())