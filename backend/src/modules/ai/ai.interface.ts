import { ExplanationMode, DifficultyLevel, QuestionType } from '../../config/constants';
import { SourceCitation } from '../rag/rag.service';

export interface AIResponseOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  citations?: SourceCitation[];
}

export interface GeneratedQuizQuestion {
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: DifficultyLevel;
  sourceChunkId?: string;
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
  topic: string;
  difficulty: DifficultyLevel;
}

export interface GeneratedStudyPlanDay {
  dayNumber: number;
  scheduledDate: string;
  topic: string;
  description: string;
  estimatedMinutes: number;
}

export interface LearningInsight {
  type: 'IMPROVEMENT' | 'WEAK_AREA' | 'RECOMMENDATION' | 'STREAK';
  title: string;
  description: string;
  suggestedTopic?: string;
}

export interface IAIProvider {
  name: string;

  generateResponse(prompt: string, context?: string, options?: AIResponseOptions): Promise<string>;

  generateExplanation(
    concept: string,
    mode: ExplanationMode,
    context?: string,
    options?: AIResponseOptions
  ): Promise<{ explanation: string; examples: string[]; keyPoints: string[]; suggestedQuestions: string[] }>;

  generateQuiz(
    topic: string,
    context: string,
    numQuestions?: number,
    difficulty?: DifficultyLevel
  ): Promise<GeneratedQuizQuestion[]>;

  generateFlashcards(
    topic: string,
    context: string,
    numCards?: number,
    difficulty?: DifficultyLevel
  ): Promise<GeneratedFlashcard[]>;

  generateStudyPlan(
    targetSubject: string,
    examDate: string,
    availableHoursPerDay: number,
    currentLevel: string,
    weakTopics: string[],
    context?: string
  ): Promise<GeneratedStudyPlanDay[]>;

  generateLearningInsights(
    masteryScores: Record<string, number>,
    weakTopics: string[],
    quizAccuracy: number,
    streakCount: number
  ): Promise<LearningInsight[]>;
}
