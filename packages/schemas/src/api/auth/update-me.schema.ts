import { z } from 'zod'
import { authPreferencesSchema } from './auth-user.schema'

/**
 * Update-me request body.
 *
 * Kept as a zod schema because the OpenAPI spec publishes `UpdateMeDto` as an
 * empty object (`Record<string, never>`). The response type is derived from
 * the generated contract instead.
 */
export const updateMeRequestSchema = z.object({
  preferences: authPreferencesSchema.partial(),
})
