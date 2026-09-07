import { z } from 'zod';

export const CreateMaterialDto = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  subjectId: z.string().uuid().optional().nullable(),
});

export type CreateMaterialInput = z.infer<typeof CreateMaterialDto>;

export const QueryMaterialsDto = z.object({
  subjectId: z.string().uuid().optional(),
  search: z.string().optional(),
  status: z.enum(['PROCESSING', 'READY', 'FAILED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

export type QueryMaterialsInput = z.infer<typeof QueryMaterialsDto>;
