import { z } from 'zod'
import { USER_CONFIG } from '@arc/enums/user'

export const forgotPasswordFormSchema = z.object({
  email: z
    .string({
      required_error: 'Please enter your email address',
      invalid_type_error: 'Please enter your email address',
    })
    .trim()
    .min(1, 'Please enter your email address')
    .max(USER_CONFIG.MAX_CHAR_EMAIL, 'That email address is too long')
    .min(USER_CONFIG.MIN_CHAR_EMAIL, 'That email address looks too short')
    .email('Enter a full email address, like name@example.com'),
})
