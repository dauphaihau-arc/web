import type { z } from 'zod';
import type { registerRequestSchema } from '~/domains/auth/api/schemas/register.schema';
import type { AuthUserEnvelope } from './auth-user.contract';

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterResponse = AuthUserEnvelope;
