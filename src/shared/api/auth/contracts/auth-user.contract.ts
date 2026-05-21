import type { z } from 'zod';
import type {
  authPreferencesSchema,
  authShopSchema,
  authUserEnvelopeSchema,
  authUserSchema
} from '~/shared/schemas/api/auth/auth-user.schema';

export type AuthPreferences = z.infer<typeof authPreferencesSchema>;
export type AuthShop = z.infer<typeof authShopSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthUserEnvelope = z.infer<typeof authUserEnvelopeSchema>;

// Backward-compatible alias while callers migrate to AuthUser.
export type UserAuthenticated = AuthUser;
