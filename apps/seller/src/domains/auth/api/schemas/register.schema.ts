import { z } from 'zod';
import {
  USER_CONFIG,
  USER_REG_NAME,
  USER_REG_PASSWORD,
} from '@arc/enums/user';
import { authUserEnvelopeSchema } from '@arc/schemas/api/auth/auth-user.schema';

export const registerFormSchema = z.object({
  display_name: z
    .string({
      required_error: 'Please enter your name',
      invalid_type_error: 'Please enter your name',
    })
    .trim()
    .min(1, 'Please enter your name')
    .max(USER_CONFIG.MAX_CHAR_NAME, `Keep your name to ${USER_CONFIG.MAX_CHAR_NAME} characters or fewer`)
    .min(USER_CONFIG.MIN_CHAR_NAME, `Your name needs at least ${USER_CONFIG.MIN_CHAR_NAME} characters`)
    .regex(USER_REG_NAME, 'Use letters and spaces only'),
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
  password: z
    .string({
      required_error: 'Please create a password',
      invalid_type_error: 'Please create a password',
    })
    .min(1, 'Please create a password')
    .max(USER_CONFIG.MAX_CHAR_PASSWORD, `Use ${USER_CONFIG.MAX_CHAR_PASSWORD} characters or fewer`)
    .min(USER_CONFIG.MIN_CHAR_PASSWORD, `Use at least ${USER_CONFIG.MIN_CHAR_PASSWORD} characters`)
    .regex(USER_REG_PASSWORD, 'Passwords need 8–16 characters, including an uppercase letter, a lowercase letter, a number, and a symbol'),
});

export const registerRequestSchema = registerFormSchema;

export const registerResponseSchema = authUserEnvelopeSchema;
