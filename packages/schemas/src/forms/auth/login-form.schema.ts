import { z } from 'zod'
import { USER_CONFIG } from '@arc/enums/user'

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(USER_CONFIG.MIN_CHAR_EMAIL)
    .max(USER_CONFIG.MAX_CHAR_EMAIL)
    .email(),
  password: z.string(),
})
