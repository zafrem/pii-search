export type PIIType =
  | 'phone'
  | 'email'
  | 'ssn'
  | 'credit_card'
  | 'name'
  | 'address'
  | 'organization'
  | 'date'
  | 'id_number'
  | 'postal_code'
  | 'bank_account'
  | 'national_id'
  | 'passport'
  | 'tax_id'
  | 'coordinates'
  | 'date_of_birth'
  | 'iban'
  | 'swift_code';

export type Language = 'korean' | 'english' | 'chinese' | 'japanese' | 'spanish' | 'french';


export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type SensitivityLevel = 'High' | 'Moderate' | 'Low';
export type RedactionStatus = 'masked' | 'raw';
export type LegalBasis = 'consent' | 'contract' | 'legal_obligation';

export interface Locale {
  country: string;
  language: string;
  script: string;
}

export interface NormalizedData {
  e164?: string;
  formatted?: string;
  canonical?: string;
}

export interface EnhancedPIIItem {
  value: string;
  pii_type: PIIType;
  locale: Locale;
  normalized?: NormalizedData;
  sensitivity: SensitivityLevel;
  confidence: number;
  context?: string;
  validators: string[];
  dedupe_key: string;
  source: string;
  first_seen: string;
  last_seen: string;
  redaction_status: RedactionStatus;
  retention_policy?: string;
  legal_basis?: LegalBasis;
  owner_team?: string;
  access_policy_id?: string;
}

export interface Position {
  start: number;
  end: number;
}

export interface BasicSearchItem {
  id: string;
  text: string;
  type: PIIType;
  language: string;
  position: Position;
  isDetected: boolean;
  source: string;
}

export interface ProbabilitySearchItem {
  id: string;
  text: string;
  type: PIIType;
  language: string;
  position: Position;
  probability: number;
  confidenceLevel: ConfidenceLevel;
  sources: string[];
  stageResults?: object;
}

export interface ResultSummary {
  totalItems: number;
  detectedItems: number;
  detectionRate: number;
  languageBreakdown: Record<string, number>;
  typeBreakdown: Partial<Record<PIIType, number>>;
}

export interface ProbabilitySummary {
  totalItems: number;
  highConfidenceItems: number;
  mediumConfidenceItems: number;
  lowConfidenceItems: number;
  averageProbability: number;
  languageBreakdown: Record<string, number>;
  typeBreakdown: Partial<Record<PIIType, number>>;
}

export interface BasicSearchResponse {
  stage: 1;
  method: 'rule_based';
  items: BasicSearchItem[];
  summary: ResultSummary;
  processingTime: number;
}

export interface EnhancedSearchResponse {
  stage: 1;
  method: 'enhanced_rule_based';
  items: EnhancedPIIItem[];
  summary: ResultSummary;
  processingTime: number;
  metadata: {
    total_sensitivity_breakdown: Record<SensitivityLevel, number>;
    validator_usage: Record<string, number>;
    locale_breakdown: Record<string, number>;
  };
}

export interface ProbabilitySearchResponse {
  stages: number[];
  method: string;
  items: ProbabilitySearchItem[];
  summary: ProbabilitySummary;
  processingTime: number;
}

export interface SearchRequest {
  text: string;
  languages: Language[];
  maxCharacters?: number;
}

export interface PatternDefinition {
  type: PIIType;
  pattern: string;
  flags?: string;
  description: string;
  examples: string[];
}

export interface LanguagePatterns {
  language: Language;
  patterns: PatternDefinition[];
  contextRules?: ContextRule[];
}

export interface ContextRule {
  type: PIIType;
  beforePatterns: string[];
  afterPatterns: string[];
  negativePatterns: string[];
  weight: number;
}