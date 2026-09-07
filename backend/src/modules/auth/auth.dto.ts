import { z } from 'zod';
import { USER_ROLES } from '../../config/constants';

export const RegisterDto = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(100),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  role: z.enum([USER_ROLES.STUDENT, USER_ROLES.TEACHER, USER_ROLES.ADMIN]).optional().default(USER_ROLES.STUDENT),
});

export type RegisterInput = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginInput = z.infer<typeof LoginDto>;

export const RefreshTokenDto = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenDto>;

export const UpdateProfileDto = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  dailyGoalMinutes: z.number().int().min(5).max(480).optional(),
  preferredExplanationMode: z.enum(['SIMPLE', 'DETAILED', 'EXAM_FOCUSED', 'BEGINNER_FRIENDLY', 'EXAMPLE_BASED']).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileDto>;
