import type { z } from 'zod';
import type {
  updateMeRequestSchema,
  updateMeResponseSchema
} from '~/shared/schemas/api/auth/update-me.schema';

export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;
export type UpdateMeResponse = z.infer<typeof updateMeResponseSchema>;
