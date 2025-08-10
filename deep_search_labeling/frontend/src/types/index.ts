export interface PIIClassificationItem {
  id: string;
  start: number;
  end: number;
  text: string;
  classification: PIIClassification;
  confidence: number;
  notes?: string;
  annotatorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextSample {
  id: string;
  projectId: string;
  text: string;
  filename?: string;
  language: string;
  status: SampleStatus;
  classifications: PIIClassificationItem[];
  annotatorIds: string[];
  qualityScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  classificationTypes: PIIClassification[];
  guidelines: string;
  status: ProjectStatus;
  createdBy: string;
  totalSamples: number;
  completedSamples: number;
  qualityThreshold: number;
  multiAnnotator: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Annotator {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  projectIds: string[];
  totalAnnotations: number;
  qualityScore: number;
  isActive: boolean;
  createdAt: Date;
}

export interface AnnotationSession {
  id: string;
  projectId: string;
  annotatorId: string;
  sampleId: string;
  startTime: Date;
  endTime?: Date;
  entitiesAnnotated: number;
  keystrokesCount: number;
  isCompleted: boolean;
}

export interface ExportConfig {
  projectId: string;
  format: ExportFormat;
  includeMetadata: boolean;
  qualityThreshold: number;
  splitRatio?: {
    train: number;
    validation: number;
    test: number;
  };
  anonymize: boolean;
}

export interface QualityMetrics {
  interAnnotatorAgreement: number;
  cohensKappa: number;
  classificationDistribution: Record<PIIClassification, number>;
  annotatorPerformance: Record<string, number>;
  completionRate: number;
  averageTime: number;
}

export enum PIIClassification {
  PII = 'pii',
  NON_PII = 'non_pii'
}

export enum SampleStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  REJECTED = 'rejected'
}

export enum ProjectStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANNOTATOR = 'annotator',
  REVIEWER = 'reviewer'
}

export enum ExportFormat {
  HUGGINGFACE = 'huggingface',
  SPACY = 'spacy',
  CONLL = 'conll',
  JSON = 'json',
  CSV = 'csv'
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LabelingState {
  selectedClassification: PIIClassificationItem | null;
  selectedText: {
    start: number;
    end: number;
    text: string;
  } | null;
  currentSample: TextSample | null;
  isEditing: boolean;
  showGuidelines: boolean;
  keyboardShortcuts: Record<string, PIIClassification>;
}

export interface AnnotationAction {
  type: 'ADD_CLASSIFICATION' | 'UPDATE_CLASSIFICATION' | 'DELETE_CLASSIFICATION' | 'CLEAR_SELECTION';
  payload?: any;
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
}