import type { z } from 'zod';
import type {
  resetPasswordRequestSchema,
  resetPasswordResponseSchema
} from '@arc/schemas/api/auth/reset-password.schema';

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;
export type ResetPasswordForm = Record<'password' | 'passwordConfirm', string>;
