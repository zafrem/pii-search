import { LanguagePatterns, PIIType } from '../../backend/src/types';

export const germanPatterns: LanguagePatterns = {
  language: 'english', // Using 'english' as placeholder - you may need to add 'german' to Language type
  patterns: [
    // German phone numbers
    {
      type: 'phone' as PIIType,
      pattern: '\\+49[-\\s]?\\d{2,4}[-\\s]?\\d{6,8}|0\\d{2,4}[-\\s]?\\d{6,8}',
      flags: 'g',
      description: 'German phone numbers',
      examples: ['+49 30 12345678', '030 12345678', '+49-30-12345678']
    },

    // German IBAN
    {
      type: 'iban' as PIIType,
      pattern: 'DE\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{2}',
      flags: 'gi',
      description: 'German IBAN',
      examples: ['DE89 3704 0044 0532 0130 00', 'DE89370400440532013000']
    },

    // German national ID (Personalausweisnummer)
    {
      type: 'national_id' as PIIType,
      pattern: '[A-Z]{1}[0-9]{8}',
      flags: 'g',
      description: 'German ID card number',
      examples: ['T22000129', 'L01X00T47']
    },

    // German tax ID (Steuerliche Identifikationsnummer)
    {
      type: 'tax_id' as PIIType,
      pattern: '\\b\\d{2}\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}\\b',
      flags: 'g',
      description: 'German tax ID',
      examples: ['12 345 678 901', '12345678901']
    },

    // German social security number
    {
      type: 'ssn' as PIIType,
      pattern: '\\d{2}\\s?\\d{6}\\s?[A-Z]\\s?\\d{3}',
      flags: 'g',
      description: 'German social security number',
      examples: ['12 345678 A 901']
    },

    // German bank account (old format)
    {
      type: 'bank_account' as PIIType,
      pattern: '\\b\\d{8,10}\\b',
      flags: 'g',
      description: 'German bank account number',
      examples: ['1234567890', '12345678']
    },

    // German postal code
    {
      type: 'postal_code' as PIIType,
      pattern: '\\b\\d{5}\\b',
      flags: 'g',
      description: 'German postal code',
      examples: ['10115', '80331', '20095']
    },

    // Geographic coordinates
    {
      type: 'coordinates' as PIIType,
      pattern: '\\b(?:lat|latitude|lng|longitude|coord)[:=]?\\s*-?\\d{1,3}\\.\\d+[°]?[\\s,]+\\s*-?\\d{1,3}\\.\\d+[°]?',
      flags: 'gi',
      description: 'Geographic coordinates',
      examples: ['lat: 52.520008, lng: 13.404954', '52.520008, 13.404954']
    },

    // Date of birth
    {
      type: 'date_of_birth' as PIIType,
      pattern: '(?:born|geboren|geb\\.?)\\s*:?\\s*\\d{1,2}[./]\\d{1,2}[./]\\d{4}',
      flags: 'gi',
      description: 'Date of birth',
      examples: ['geboren: 15.03.1990', 'born 15/03/1990']
    }
  ],
  contextRules: [
    {
      type: 'iban' as PIIType,
      beforePatterns: ['iban', 'kontonummer', 'bankverbindung'],
      afterPatterns: [],
      negativePatterns: ['beispiel', 'muster'],
      weight: 0.95
    },
    {
      type: 'tax_id' as PIIType,
      beforePatterns: ['steuer-id', 'steuerliche identifikationsnummer', 'steuernummer'],
      afterPatterns: [],
      negativePatterns: ['beispiel', 'muster'],
      weight: 0.9
    }
  ]
};