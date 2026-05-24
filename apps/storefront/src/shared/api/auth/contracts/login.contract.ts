import type { z } from 'zod'
import type {
  loginRequestSchema,
  loginResponseSchema,
} from '@arc/schemas/api/auth/login.schema'

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
