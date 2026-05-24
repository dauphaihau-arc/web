import type { z } from 'zod';
import type { verifyTokenRequestSchema } from '~/shared/schemas/api/auth/verify-token.schema';

export type VerifyTokenRequestPayload = z.infer<typeof verifyTokenRequestSchema>;
export type VerifyTokenResponse = undefined;
