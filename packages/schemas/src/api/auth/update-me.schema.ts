import { z } from 'zod'
import { authPreferencesSchema, authUserSchema } from './auth-user.schema'

export const updateMeRequestSchema = z.object({
  preferences: authPreferencesSchema.partial(),
})

export const updateMeResponseSchema = authUserSchema
