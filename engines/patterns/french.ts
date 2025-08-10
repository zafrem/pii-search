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