import type { z } from 'zod';
import type {
  registerRequestSchema,
  registerResponseSchema,
} from '~/domains/auth/api/schemas/register.schema';

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
