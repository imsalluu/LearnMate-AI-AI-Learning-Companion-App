import { z } from 'zod';
import { DIFFICULTY_LEVELS, QUESTION_TYPES } from '../../config/constants';

export const GenerateQuizDto = z.object({
  topic: z.string().min(1),
  materialId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  difficulty: z.enum([DIFFICULTY_LEVELS.EASY, DIFFICULTY_LEVELS.MEDIUM, DIFFICULTY_LEVELS.HARD]).default(DIFFICULTY_LEVELS.MEDIUM),
  numQuestions: z.coerce.number().int().min(1).max(20).default(5),
  timeLimitSeconds: z.coerce.number().int().min(60).max(3600).default(600),
});

export type GenerateQuizInput = z.infer<typeof GenerateQuizDto>;

export const SubmitQuizAttemptDto = z.object({
  timeSpentSeconds: z.number().int().min(0).default(0),
  answers: z.array(
    z.object({
      questionId: z.string(),
      userAnswer: z.string(),
    })
  ),
});

export type SubmitQuizAttemptInput = z.infer<typeof SubmitQuizAttemptDto>;
