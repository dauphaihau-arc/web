import { z } from 'zod'
import { USER_CONFIG, USER_REG_PASSWORD } from '@arc/enums/user'
import { authUserEnvelopeSchema } from './auth-user.schema'

export const resetPasswordRequestSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(USER_CONFIG.MIN_CHAR_PASSWORD)
    .max(USER_CONFIG.MAX_CHAR_PASSWORD)
    .regex(USER_REG_PASSWORD),
})

export const resetPasswordResponseSchema = authUserEnvelopeSchema
