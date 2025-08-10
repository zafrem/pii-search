import { LanguagePatterns, PIIType } from '../../backend/src/types';

export const englishPatterns: LanguagePatterns = {
  language: 'english',
  patterns: [
    {
      type: 'phone' as PIIType,
      pattern: '\\+?1?[-\\.\\s]?\\(?[0-9]{3}\\)?[-\\.\\s]?[0-9]{3}[-\\.\\s]?[0-9]{4}',
      flags: 'g',
      description: 'US phone numbers',
      examples: ['+1-555-123-4567', '(555) 123-4567', '555.123.4567', '5551234567']
    },
    {
      type: 'ssn' as PIIType,
      pattern: '\\d{3}-?\\d{2}-?\\d{4}',
      flags: 'g',
      description: 'US Social Security Numbers',
      examples: ['123-45-6789', '123456789']
    },
    {
      type: 'credit_card' as PIIType,
      pattern: '(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})',
      flags: 'g',
      description: 'Credit card numbers (Visa, MasterCard, Amex, Discover)',
      examples: ['4111111111111111', '5555555555554444', '378282246310005']
    },
    {
      type: 'email' as PIIType,
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      flags: 'gi',
      description: 'Email addresses',
      examples: ['user@example.com', 'john.doe@company.org', 'test+tag@domain.co.uk']
    },
    {
      type: 'name' as PIIType,
      pattern: '\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b',
      flags: 'g',
      description: 'Full names (First Last)',
      examples: ['John Smith', 'Mary Johnson', 'David Wilson']
    },
    {
      type: 'name' as PIIType,
      pattern: '(?<=(?:Mr\\.?|Mrs\\.?|Ms\\.?|Dr\\.?)\\s+)[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*',
      flags: 'g',
      description: 'Names with titles',
      examples: ['Mr. John Smith', 'Dr. Sarah Wilson', 'Mrs. Mary Brown']
    },
    {
      type: 'address' as PIIType,
      pattern: '\\d+\\s+[A-Za-z\\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)',
      flags: 'gi',
      description: 'Street addresses',
      examples: ['123 Main Street', '456 Oak Avenue', '789 First Road']
    },
    {
      type: 'postal_code' as PIIType,
      pattern: '\\b\\d{5}(?:-\\d{4})?\\b',
      flags: 'g',
      description: 'US ZIP codes',
      examples: ['12345', '12345-6789']
    },
    {
      type: 'date' as PIIType,
      pattern: '\\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\\d|3[01])[/-](?:19|20)?\\d{2}\\b',
      flags: 'g',
      description: 'US date formats (MM/DD/YYYY, MM-DD-YY)',
      examples: ['01/15/2023', '12-25-23', '3/4/2024']
    }
  ],
  contextRules: [
    {
      type: 'name' as PIIType,
      beforePatterns: ['name', 'contact', 'person', 'mr', 'mrs', 'ms', 'dr'],
      afterPatterns: ['said', 'stated', 'mentioned', 'reported'],
      negativePatterns: ['company', 'organization', 'business', 'corp'],
      weight: 0.7
    },
    {
      type: 'phone' as PIIType,
      beforePatterns: ['phone', 'tel', 'call', 'contact', 'mobile', 'cell'],
      afterPatterns: [],
      negativePatterns: ['fax', 'extension'],
      weight: 0.9
    },
    {
      type: 'ssn' as PIIType,
      beforePatterns: ['ssn', 'social security', 'social security number'],
      afterPatterns: [],
      negativePatterns: ['employer', 'federal'],
      weight: 0.95
    }
  ]
};