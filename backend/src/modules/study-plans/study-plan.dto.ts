import { z } from 'zod';

export const GenerateStudyPlanDto = z.object({
  targetSubject: z.string().min(1),
  examDate: z.string().optional(),
  availableHoursPerDay: z.coerce.number().min(0.5).max(12).default(2.0),
  currentLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Beginner'),
  weakTopics: z.array(z.string()).default([]),
  subjectId: z.string().uuid().optional(),
});

export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanDto>;

export const RescheduleStudyPlanDto = z.object({
  instruction: z.string().min(1), // e.g. "Move day 2 session to day 4"
});

export type RescheduleStudyPlanInput = z.infer<typeof RescheduleStudyPlanDto>;

export const TogglePlanItemDto = z.object({
  isCompleted: z.boolean(),
});

export type TogglePlanItemInput = z.infer<typeof TogglePlanItemDto>;
