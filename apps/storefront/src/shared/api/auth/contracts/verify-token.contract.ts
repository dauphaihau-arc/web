import type { z } from 'zod'
import type { verifyTokenRequestSchema } from '@arc/schemas/api/auth/verify-token.schema'

export type VerifyTokenRequestPayload = z.infer<typeof verifyTokenRequestSchema>
export type VerifyTokenResponse = undefined
