import { z } from 'zod';

export interface ToolDefinition<T = any> {
  name: string;
  description: string;
  schema: z.ZodType<T>;
  execute: (input: T, context: { userId: string }) => Promise<any>;
}

export const SearchMaterialsInputSchema = z.object({
  query: z.string().min(1),
  subjectId: z.string().uuid().optional(),
  materialId: z.string().uuid().optional(),
});

export const GenerateQuizToolInputSchema = z.object({
  topic: z.string().min(1),
  numQuestions: z.number().int().min(1).max(20).default(4),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
});

export const GenerateFlashcardsToolInputSchema = z.object({
  topic: z.string().min(1),
  numCards: z.number().int().min(1).max(30).default(5),
});

export const UpdateStudyPlanToolInputSchema = z.object({
  studyPlanId: z.string().optional(),
  dayNumber: z.number().int().min(1),
  newTopic: z.string().min(1),
  reason: z.string().optional(),
});

export const SaveLearningSessionToolInputSchema = z.object({
  sessionType: z.enum(['CHAT', 'QUIZ', 'FLASHCARD', 'VOICE']),
  durationMinutes: z.number().int().min(1),
  topicsCovered: z.array(z.string()),
  score: z.number().optional(),
});
