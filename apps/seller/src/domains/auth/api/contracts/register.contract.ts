import type { z } from 'zod';
import type {
  registerRequestSchema,
  registerResponseSchema,
} from '~/app/pages/register/_schemes/register.scheme';

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
