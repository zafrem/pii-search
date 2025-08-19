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
  | 'postal_code';

export type Language = 'korean' | 'english' | 'chinese' | 'japanese' | 'spanish' | 'french';


export type ConfidenceLevel = 'high' | 'medium' | 'low';

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