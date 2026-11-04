import type { z } from 'zod';
import type { loginRequestSchema } from '@arc/schemas/api/auth/login.schema';
import type { AuthUserEnvelope } from './auth-user.contract';

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = AuthUserEnvelope;
