import { LanguagePatterns, PIIType } from '../../backend/src/types';

export const frenchPatterns: LanguagePatterns = {
  language: 'french',
  patterns: [
    {
      type: 'phone' as PIIType,
      pattern: '\\+?33[1-9](?:[-\\.\\s]?\\d{2}){4}',
      flags: 'g',
      description: 'French phone numbers',
      examples: ['+33 1 23 45 67 89', '33-1-23-45-67-89', '0123456789']
    },
    {
      type: 'phone' as PIIType,
      pattern: '0[1-9](?:[-\\.\\s]?\\d{2}){4}',
      flags: 'g',
      description: 'French domestic phone numbers',
      examples: ['01 23 45 67 89', '06-12-34-56-78', '0123456789']
    },
    {
      type: 'postal_code' as PIIType,
      pattern: '\\d{5}',
      flags: 'g',
      description: 'French postal codes',
      examples: ['75001', '13001', '69001']
    },
    {
      type: 'name' as PIIType,
      pattern: '[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüç]+(?:\\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüç]+)*(?=\\s+(?:M\\.|Mme|Dr\\.|Pr\\.))',
      flags: 'g',
      description: 'French names with titles',
      examples: ['Jean Dupont M.', 'Marie Durand Mme', 'Pierre Martin Dr.']
    },
    {
      type: 'name' as PIIType,
      pattern: '(?<=(?:M\\.|Mme|Mlle|Dr\\.|Pr\\.)\\s+)[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüç]+(?:\\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüç]+)*',
      flags: 'g',
      description: 'French names after titles',
      examples: ['M. Jean Dupont', 'Mme Marie Durand', 'Dr. Pierre Martin']
    },
    {
      type: 'address' as PIIType,
      pattern: '\\d+(?:,?\\s+(?:rue|avenue|boulevard|place|impasse|allée|chemin))\\s+[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇa-zàâäéèêëïîôöùûüç\\s]+',
      flags: 'gi',
      description: 'French street addresses',
      examples: ['123 rue de la Paix', '45 avenue des Champs-Élysées', '7 place de la République']
    },
    {
      type: 'email' as PIIType,
      pattern: '[a-zA-Z0-9àâäéèêëïîôöùûüç._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      flags: 'gi',
      description: 'Email addresses (including French characters)',
      examples: ['jean@exemple.fr', 'marie@entreprise.com', 'utilisateur@courrier.fr']
    },
    {
      type: 'organization' as PIIType,
      pattern: '[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ][a-zàâäéèêëïîôöùûüç\\s]+(?:S\\.A\\.|SARL|SAS|EURL|Société|Entreprise|Association|Fondation)',
      flags: 'g',
      description: 'French companies and organizations',
      examples: ['Société Générale S.A.', 'Entreprise Martin SARL', 'Fondation de France']
    },
    {
      type: 'id_number' as PIIType,
      pattern: '[1-2]\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{5}\\d{2}',
      flags: 'g',
      description: 'French social security numbers (INSEE)',
      examples: ['123456789012345', '298765432109876']
    },
    {
      type: 'bank_account' as PIIType,
      pattern: 'FR\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{3}',
      flags: 'gi',
      description: 'French IBAN bank account numbers',
      examples: ['FR14 2004 1010 0505 0001 3M02 606', 'FR1420041010050500013M02606']
    },
    {
      type: 'national_id' as PIIType,
      pattern: '[1-2]\\d{14}',
      flags: 'g',
      description: 'French national ID (INSEE number)',
      examples: ['123456789012345', '298765432109876']
    },
    {
      type: 'passport' as PIIType,
      pattern: '\\d{2}[A-Z]{2}\\d{5}',
      flags: 'g',
      description: 'French passport numbers',
      examples: ['12AB34567', '98XY76543']
    },
    {
      type: 'coordinates' as PIIType,
      pattern: '(?:latitude|lat)[:=]?\\s*[45]\\d\\.\\d+[°]?[\\s,]*(?:longitude|lng)[:=]?\\s*[0-8]\\.\\d+[°]?',
      flags: 'gi',
      description: 'French geographic coordinates',
      examples: ['latitude: 48.8566, longitude: 2.3522', 'lat 45.7640, lng 4.8357']
    },
    {
      type: 'date_of_birth' as PIIType,
      pattern: '(?:date de naissance|né|née)[:=]?\\s*\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}',
      flags: 'gi',
      description: 'French date of birth',
      examples: ['date de naissance: 15/03/1990', 'né 25-12-1985']
    },
    {
      type: 'tax_id' as PIIType,
      pattern: '[0-9]{13}',
      flags: 'g',
      description: 'French SIREN business number',
      examples: ['123456789', '987654321012']
    },
    {
      type: 'swift_code' as PIIType,
      pattern: '[A-Z]{4}FR[A-Z0-9]{2}(?:[A-Z0-9]{3})?',
      flags: 'g',
      description: 'French bank SWIFT codes',
      examples: ['BNPAFRPP', 'SOGEFRPP001']
    },
    {
      type: 'credit_card' as PIIType,
      pattern: '\\b(?:4\\d{3}|5[1-5]\\d{2}|6011|3[47]\\d{2})[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b',
      flags: 'g',
      description: 'French credit card numbers',
      examples: ['4111 1111 1111 1111', '5555-5555-5555-4444']
    }
  ],
  contextRules: [
    {
      type: 'name' as PIIType,
      beforePatterns: ['nom', 'prénom', 'contact', 'personne', 'monsieur', 'madame', 'docteur'],
      afterPatterns: ['a dit', 'a mentionné', 'a déclaré', 'a indiqué'],
      negativePatterns: ['entreprise', 'société', 'organisation', 'compagnie'],
      weight: 0.7
    },
    {
      type: 'phone' as PIIType,
      beforePatterns: ['téléphone', 'tél', 'mobile', 'portable', 'contact'],
      afterPatterns: [],
      negativePatterns: ['fax', 'télécopie', 'extension'],
      weight: 0.9
    },
    {
      type: 'id_number' as PIIType,
      beforePatterns: ['numéro de sécurité sociale', 'insee', 'identification'],
      afterPatterns: [],
      negativePatterns: ['entreprise', 'société'],
      weight: 0.95
    }
  ]
};