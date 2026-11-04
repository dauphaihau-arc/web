import type { z } from 'zod';
import type { updateMeRequestSchema } from '@arc/schemas/api/auth/update-me.schema';
import type { AuthUser } from './auth-user.contract';

export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;
export type UpdateMeResponse = AuthUser;
