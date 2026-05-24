import { z } from 'zod'

export const authClientConfigSchema = z.object({
  version: z.string(),
  password: z.object({
    min_length: z.number(),
    max_length: z.number(),
    pattern: z.string(),
    requirements: z.object({
      lowercase: z.boolean(),
      uppercase: z.boolean(),
      number: z.boolean(),
      special_character: z.boolean(),
    }),
    message: z.string(),
  }),
  session: z.object({
    access_token_ttl_seconds: z.number(),
    refresh_token_ttl_seconds: z.number(),
  }),
})
