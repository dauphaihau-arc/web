import { z } from 'zod';
import { TokenTypes } from '~/shared/config/enums/token';

export const verifyTokenRequestSchema = z.object({
  token: z.string(),
  type: z.literal(TokenTypes.RESET_PASSWORD),
});
