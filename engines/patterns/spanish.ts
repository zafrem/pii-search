import { LanguagePatterns, PIIType } from '../../backend/src/types';

export const spanishPatterns: LanguagePatterns = {
  language: 'spanish',
  patterns: [
    {
      type: 'phone' as PIIType,
      pattern: '\\+?34[-\\.\\s]?[6-9]\\d{2}[-\\.\\s]?\\d{3}[-\\.\\s]?\\d{3}',
      flags: 'g',
      description: 'Spanish mobile phone numbers',
      examples: ['+34 612 345 678', '34-612-345-678', '612345678']
    },
    {
      type: 'phone' as PIIType,
      pattern: '\\+?34[-\\.\\s]?[89]\\d{2}[-\\.\\s]?\\d{3}[-\\.\\s]?\\d{3}',
      flags: 'g',
      description: 'Spanish landline numbers',
      examples: ['+34 91 123 4567', '91-123-4567', '911234567']
    },
    {
      type: 'id_number' as PIIType,
      pattern: '\\d{8}[A-Z]',
      flags: 'g',
      description: 'Spanish DNI (National Identity Document)',
      examples: ['12345678A', '87654321B']
    },
    {
      type: 'name' as PIIType,
      pattern: '[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*(?=\\s+(?:Sr\\.|Sra\\.|Dr\\.|Dra\\.))',
      flags: 'g',
      description: 'Spanish names with titles',
      examples: ['Juan Pérez Sr.', 'María García Dra.', 'Antonio López Dr.']
    },
    {
      type: 'name' as PIIType,
      pattern: '(?<=(?:Sr\\.|Sra\\.|Dr\\.|Dra\\.|Don|Doña)\\s+)[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)*',
      flags: 'g',
      description: 'Spanish names after titles',
      examples: ['Sr. Juan Pérez', 'Dra. María García', 'Don Antonio López']
    },
    {
      type: 'address' as PIIType,
      pattern: '(?:Calle|Avenida|Plaza|Paseo)\\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü\\s]+,?\\s*\\d+',
      flags: 'gi',
      description: 'Spanish street addresses',
      examples: ['Calle Mayor 123', 'Avenida de la Constitución 45', 'Plaza España 7']
    },
    {
      type: 'postal_code' as PIIType,
      pattern: '\\d{5}',
      flags: 'g',
      description: 'Spanish postal codes',
      examples: ['28001', '08001', '41001']
    },
    {
      type: 'email' as PIIType,
      pattern: '[a-zA-Z0-9áéíóúñü._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      flags: 'gi',
      description: 'Email addresses (including Spanish characters)',
      examples: ['josé@example.com', 'maría@empresa.es', 'usuario@correo.com']
    },
    {
      type: 'organization' as PIIType,
      pattern: '[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü\\s]+(?:S\\.A\\.|S\\.L\\.|S\\.L\\.U\\.|Ltda\\.|Cía\\.|Empresa|Corporación|Fundación)',
      flags: 'g',
      description: 'Spanish companies and organizations',
      examples: ['Telefónica S.A.', 'Banco Santander S.A.', 'Fundación BBVA']
    },
    {
      type: 'bank_account' as PIIType,
      pattern: 'ES\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}',
      flags: 'gi',
      description: 'Spanish IBAN bank account numbers',
      examples: ['ES91 2100 0418 4502 0005 1332', 'ES9121000418450200051332']
    },
    {
      type: 'national_id' as PIIType,
      pattern: '\\d{8}[A-Z]',
      flags: 'g',
      description: 'Spanish DNI (Documento Nacional de Identidad)',
      examples: ['12345678A', '87654321B']
    },
    {
      type: 'passport' as PIIType,
      pattern: '[A-Z]{3}\\d{6}',
      flags: 'g',
      description: 'Spanish passport numbers',
      examples: ['AAA123456', 'ZZZ987654']
    },
    {
      type: 'coordinates' as PIIType,
      pattern: '(?:latitud|lat|latitude)[:=]?\\s*[34]\\d\\.\\d+[°]?[\\s,]*(?:longitud|lng|longitude)[:=]?\\s*-?[0-5]\\.\\d+[°]?',
      flags: 'gi',
      description: 'Spanish geographic coordinates',
      examples: ['latitud: 40.4168, longitud: -3.7038', 'lat 41.3851, lng 2.1734']
    },
    {
      type: 'date_of_birth' as PIIType,
      pattern: '(?:fecha de nacimiento|nacido|nacida)[:=]?\\s*\\d{1,2}[/-]\\d{1,2}[/-]\\d{4}',
      flags: 'gi',
      description: 'Spanish date of birth',
      examples: ['fecha de nacimiento: 15/03/1990', 'nacido 25-12-1985']
    },
    {
      type: 'tax_id' as PIIType,
      pattern: '[ABCDEFGHJNPQRSUVW]\\d{8}',
      flags: 'g',
      description: 'Spanish CIF (Corporate tax ID)',
      examples: ['A12345674', 'B87654321']
    },
    {
      type: 'swift_code' as PIIType,
      pattern: '[A-Z]{4}ES[A-Z0-9]{2}(?:[A-Z0-9]{3})?',
      flags: 'g',
      description: 'Spanish bank SWIFT codes',
      examples: ['BSCHESMM', 'CAIXESBB001']
    },
    {
      type: 'credit_card' as PIIType,
      pattern: '\\b(?:4\\d{3}|5[1-5]\\d{2}|6011|3[47]\\d{2})[-\\s]?\\d{4}[-\\s]?\\d{4}[-\\s]?\\d{4}\\b',
      flags: 'g',
      description: 'Spanish credit card numbers',
      examples: ['4111 1111 1111 1111', '5555-5555-5555-4444']
    }
  ],
  contextRules: [
    {
      type: 'name' as PIIType,
      beforePatterns: ['nombre', 'apellido', 'contacto', 'persona', 'sr', 'sra', 'dr', 'dra'],
      afterPatterns: ['dijo', 'mencionó', 'informó', 'declaró'],
      negativePatterns: ['empresa', 'compañía', 'organización', 'sociedad'],
      weight: 0.7
    },
    {
      type: 'phone' as PIIType,
      beforePatterns: ['teléfono', 'tel', 'móvil', 'celular', 'contacto'],
      afterPatterns: [],
      negativePatterns: ['fax', 'extensión'],
      weight: 0.9
    },
    {
      type: 'id_number' as PIIType,
      beforePatterns: ['dni', 'documento', 'identificación', 'cédula'],
      afterPatterns: [],
      negativePatterns: ['empresa', 'corporativo'],
      weight: 0.95
    }
  ]
};