import { z } from 'zod'
import { USER_CONFIG, USER_REG_PASSWORD } from '@arc/enums/user'

/**
 * Reset-password request body.
 *
 * Kept as a zod schema because the OpenAPI spec publishes `ResetPasswordDto`
 * as an empty object (`Record<string, never>`) and models `token` only as a
 * query parameter. The response type is derived from the generated contract.
 */
export const resetPasswordRequestSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(USER_CONFIG.MIN_CHAR_PASSWORD)
    .max(USER_CONFIG.MAX_CHAR_PASSWORD)
    .regex(USER_REG_PASSWORD),
  app: z.enum(['storefront', 'seller', 'admin']).optional(),
})
