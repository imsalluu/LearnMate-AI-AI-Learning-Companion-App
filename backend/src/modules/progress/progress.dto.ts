import { z } from 'zod';

export const RecordLearningSessionDto = z.object({
  sessionType: z.enum(['CHAT', 'QUIZ', 'FLASHCARD', 'VOICE']),
  durationMinutes: z.number().int().min(1),
  subjectId: z.string().uuid().optional(),
  topicsCovered: z.array(z.string()).default([]),
  score: z.number().optional(),
});

export type RecordLearningSessionInput = z.infer<typeof RecordLearningSessionDto>;

export const UpdateTopicProgressDto = z.object({
  topicName: z.string().min(1),
  subjectId: z.string().uuid().optional(),
  isCorrect: z.boolean(),
});

export type UpdateTopicProgressInput = z.infer<typeof UpdateTopicProgressDto>;
