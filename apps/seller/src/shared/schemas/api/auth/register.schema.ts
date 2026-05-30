import { z } from 'zod'
import {
  USER_CONFIG,
  USER_REG_NAME,
  USER_REG_PASSWORD,
} from '@arc/enums/user'
import { authUserEnvelopeSchema } from '@arc/schemas/api/auth/auth-user.schema'

export const registerFormSchema = z.object({
  display_name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'invalid type name',
    })
    .trim()
    .regex(USER_REG_NAME, 'Name is invalid')
    .min(USER_CONFIG.MIN_CHAR_NAME, `Name must be at least ${USER_CONFIG.MIN_CHAR_NAME} characters`)
    .max(USER_CONFIG.MAX_CHAR_NAME, `Name must be no longer than ${USER_CONFIG.MAX_CHAR_NAME} characters`),
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'invalid type email',
    })
    .trim()
    .min(USER_CONFIG.MIN_CHAR_EMAIL, `Email must be at least ${USER_CONFIG.MIN_CHAR_EMAIL} characters`)
    .max(USER_CONFIG.MAX_CHAR_EMAIL, `Email must be no longer than ${USER_CONFIG.MAX_CHAR_EMAIL} characters`)
    .email('invalid email'),
  password: z
    .string()
    .min(USER_CONFIG.MIN_CHAR_PASSWORD)
    .max(USER_CONFIG.MAX_CHAR_PASSWORD)
    .regex(USER_REG_PASSWORD),
})

export const registerRequestSchema = registerFormSchema

export const registerResponseSchema = authUserEnvelopeSchema
