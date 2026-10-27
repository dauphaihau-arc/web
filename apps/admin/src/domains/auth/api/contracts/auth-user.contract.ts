import type { z } from 'zod';
import type {
  authPreferencesSchema,
  authUserEnvelopeSchema,
  authUserSchema,
  currentUserEnvelopeSchema,
  currentUserSchema,
} from '@arc/schemas/api/auth/auth-user.schema';

export type AuthPreferences = z.infer<typeof authPreferencesSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthUserEnvelope = z.infer<typeof authUserEnvelopeSchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type CurrentUserEnvelope = z.infer<typeof currentUserEnvelopeSchema>;
