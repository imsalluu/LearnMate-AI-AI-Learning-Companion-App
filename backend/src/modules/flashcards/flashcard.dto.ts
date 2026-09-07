import { z } from 'zod';
import { DIFFICULTY_LEVELS } from '../../config/constants';

export const GenerateFlashcardsDto = z.object({
  topic: z.string().min(1),
  materialId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  difficulty: z.enum([DIFFICULTY_LEVELS.EASY, DIFFICULTY_LEVELS.MEDIUM, DIFFICULTY_LEVELS.HARD]).default(DIFFICULTY_LEVELS.MEDIUM),
  numCards: z.coerce.number().int().min(1).max(30).default(5),
});

export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsDto>;

export const CreateFlashcardDto = z.object({
  front: z.string().min(1),
  back: z.string().min(1),
  topic: z.string().optional(),
  subjectId: z.string().uuid().optional(),
  difficulty: z.enum([DIFFICULTY_LEVELS.EASY, DIFFICULTY_LEVELS.MEDIUM, DIFFICULTY_LEVELS.HARD]).default(DIFFICULTY_LEVELS.MEDIUM),
});

export type CreateFlashcardInput = z.infer<typeof CreateFlashcardDto>;

export const ReviewFlashcardDto = z.object({
  quality: z.number().int().min(0).max(5), // 0: complete blackout, 3: pass with effort, 5: perfect recall
  responseTimeMs: z.number().int().min(0).default(0),
  isKnown: z.boolean().default(true),
});

export type ReviewFlashcardInput = z.infer<typeof ReviewFlashcardDto>;
