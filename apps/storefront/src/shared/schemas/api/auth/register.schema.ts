import { z } from 'zod';
import { authPreferencesSchema, authUserEnvelopeSchema } from './auth-user.schema';
import { USER_CONFIG, USER_REG_PASSWORD } from '~/shared/config/enums/user';

export const registerRequestSchema = z.object({
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
  display_name: z.string().trim().min(1).optional(),
  preferences: authPreferencesSchema.partial().optional(),
});

export const registerResponseSchema = authUserEnvelopeSchema;
