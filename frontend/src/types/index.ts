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

export type SearchStage = 1 | 2 | 3;

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

export interface DeepSearchItem {
  id: string;
  text: string;
  classification: 'pii' | 'non_pii';
  language: string;
  position: Position;
  probability: number;
  confidenceLevel: ConfidenceLevel;
  sources: string[];
  context?: string;
}

export interface ResultSummary {
  totalItems: number;
  detectedItems: number;
  detectionRate: number;
  languageBreakdown: Record<string, number>;
  typeBreakdown: Record<PIIType, number>;
}

export interface ProbabilitySummary {
  totalItems: number;
  detectedItems?: number;
  highConfidenceItems: number;
  mediumConfidenceItems: number;
  lowConfidenceItems: number;
  averageProbability: number;
  languageBreakdown: Record<string, number>;
  typeBreakdown: Record<PIIType, number>;
}

export interface BasicSearchResponse {
  stage: 1;
  method: 'rule_based';
  items: BasicSearchItem[];
  summary: ResultSummary;
  processingTime: number;
}

export interface ProbabilitySearchResponse {
  stage?: 2 | 3;
  stages?: number[];
  method: string;
  items: ProbabilitySearchItem[];
  summary: ProbabilitySummary;
  processingTime: number;
}

export interface DeepSearchResponse {
  stage: 2;
  method: string;
  items: DeepSearchItem[];
  summary: {
    totalItems: number;
    detectedItems?: number;
    highConfidenceItems: number;
    mediumConfidenceItems: number;
    lowConfidenceItems: number;
    averageProbability: number;
    languageBreakdown: Record<string, number>;
    classificationBreakdown: Record<string, number>;
  };
  processingTime: number;
  modelInfo?: any;
}

export interface SearchRequest {
  text: string;
  languages: Language[];
  maxCharacters?: number;
}

export interface ContextSearchRequest extends SearchRequest {
  previousDetections: any[]; // Items from previous stages
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    status?: number;
    timestamp?: string;
    path?: string;
    method?: string;
  };
  metadata?: {
    requestId?: string;
    timestamp: string;
    apiVersion: string;
  };
}

export interface SearchState {
  stage: SearchStage;
  isLoading: boolean;
  text: string;
  selectedLanguages: Language[];
  results: {
    stage1?: BasicSearchResponse;
    stage2?: DeepSearchResponse;
    stage3?: ProbabilitySearchResponse;
  };
  error?: string;
}

export interface LanguageOption {
  value: Language;
  label: string;
  flag: string;
}

export interface StageProgress {
  stage: SearchStage;
  isCompleted: boolean;
  isActive: boolean;
  isEnabled: boolean;
}

export interface HighlightRange {
  start: number;
  end: number;
  type: PIIType;
  stage: SearchStage;
  isDetected?: boolean;
  probability?: number;
  confidenceLevel?: ConfidenceLevel;
}