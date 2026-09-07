export const USER_ROLES = {
  STUDENT: 'STUDENT',
  TEACHER: 'TEACHER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const MATERIAL_STATUS = {
  PROCESSING: 'PROCESSING',
  READY: 'READY',
  FAILED: 'FAILED',
} as const;

export type MaterialStatus = (typeof MATERIAL_STATUS)[keyof typeof MATERIAL_STATUS];

export const EXPLANATION_MODES = {
  SIMPLE: 'simple',
  DETAILED: 'detailed',
  EXAM_FOCUSED: 'exam-focused',
  BEGINNER_FRIENDLY: 'beginner-friendly',
  EXAMPLE_BASED: 'example-based',
} as const;

export type ExplanationMode = (typeof EXPLANATION_MODES)[keyof typeof EXPLANATION_MODES];

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
  SHORT_ANSWER: 'SHORT_ANSWER',
  SCENARIO_BASED: 'SCENARIO_BASED',
} as const;

export type QuestionType = (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export const DIFFICULTY_LEVELS = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[keyof typeof DIFFICULTY_LEVELS];

export const QUEUES = {
  DOCUMENT_INGESTION: 'document-ingestion-queue',
  AI_PROCESSING: 'ai-processing-queue',
} as const;
