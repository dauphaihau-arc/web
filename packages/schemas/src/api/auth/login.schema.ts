import { z } from 'zod'
import { USER_CONFIG, USER_REG_PASSWORD } from '@arc/enums/user'

/**
 * Login request body.
 *
 * Kept as a zod schema because the OpenAPI spec publishes `LoginDto` as an
 * empty object (`Record<string, never>`), so it does not model these fields.
 * The login response type is derived from the generated contract instead.
 */
export const loginRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(USER_CONFIG.MIN_CHAR_EMAIL)
    .max(USER_CONFIG.MAX_CHAR_EMAIL)
    .email(),
  password: z
    .string()
    .min(USER_CONFIG.MIN_CHAR_PASSWORD)
    .max(USER_CONFIG.MAX_CHAR_PASSWORD)
    .regex(USER_REG_PASSWORD),
  app: z.enum(['storefront', 'seller', 'admin']).optional(),
})
