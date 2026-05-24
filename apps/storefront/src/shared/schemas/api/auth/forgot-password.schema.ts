import { z } from 'zod';
import { USER_CONFIG } from '~/shared/config/enums/user';

export const forgotPasswordRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(USER_CONFIG.MIN_CHAR_EMAIL)
    .max(USER_CONFIG.MAX_CHAR_EMAIL)
    .email(),
});
