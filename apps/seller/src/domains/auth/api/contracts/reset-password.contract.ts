import type { z } from 'zod';
import type { resetPasswordRequestSchema } from '@arc/schemas/api/auth/reset-password.schema';
import type { AuthUserEnvelope } from './auth-user.contract';

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordResponse = AuthUserEnvelope;
export type ResetPasswordForm = Record<'password' | 'passwordConfirm', string>;
