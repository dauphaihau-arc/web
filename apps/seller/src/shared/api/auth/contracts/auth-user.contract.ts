import type { z } from 'zod'
import type {
  authPreferencesSchema,
  authShopSchema,
  authUserEnvelopeSchema,
  authUserSchema,
  currentUserEnvelopeSchema,
  currentUserSchema,
  currentUserShopSchema,
} from '@arc/schemas/api/auth/auth-user.schema'

export type AuthPreferences = z.infer<typeof authPreferencesSchema>
export type AuthShop = z.infer<typeof authShopSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type AuthUserEnvelope = z.infer<typeof authUserEnvelopeSchema>
export type CurrentUserShop = z.infer<typeof currentUserShopSchema>
export type CurrentUser = z.infer<typeof currentUserSchema>
export type CurrentUserEnvelope = z.infer<typeof currentUserEnvelopeSchema>

// Backward-compatible alias while callers migrate to AuthUser.
export type UserAuthenticated = AuthUser
