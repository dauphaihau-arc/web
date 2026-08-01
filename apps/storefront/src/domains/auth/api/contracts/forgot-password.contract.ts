import type { z } from 'zod';
import type { forgotPasswordRequestSchema } from '@arc/schemas/api/auth/forgot-password.schema';

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ForgotPasswordResponse = undefined;
