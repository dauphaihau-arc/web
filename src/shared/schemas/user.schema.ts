import { z } from 'zod';
import { USER_CONFIG, USER_REG_NAME, USER_REG_PASSWORD } from '~/config/enums/user';
import { objectIdSchema } from '~/schemas/sub/objectId.schema';
import { MARKET_CURRENCIES, MARKET_LANGUAGES, MARKET_REGIONS } from '~/config/enums/market';

export const userSchema = z.object({
  id: objectIdSchema,
  name: z
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
    .min(USER_CONFIG.MIN_CHAR_PASSWORD, `Password must be at least ${USER_CONFIG.MIN_CHAR_PASSWORD} characters`)
    .max(USER_CONFIG.MAX_CHAR_PASSWORD, `Password must be no longer than ${USER_CONFIG.MAX_CHAR_PASSWORD} characters`)
    .regex(USER_REG_PASSWORD, 'Password must contain at least 1 lower letter, 1 uppercase letter, 1 number and 1 special character'),
  is_email_verified: z
    .boolean()
    .optional(),
  shop: objectIdSchema.optional(),
  market_preferences: z.object({
    region: z.nativeEnum(MARKET_REGIONS).default(MARKET_REGIONS.UNITED_STATES),
    language: z.nativeEnum(MARKET_LANGUAGES).default(MARKET_LANGUAGES.EN),
    currency: z.nativeEnum(MARKET_CURRENCIES).default(MARKET_CURRENCIES.USD),
  }).optional(),
  updated_at: z.date(),
  created_at: z.date(),
});
