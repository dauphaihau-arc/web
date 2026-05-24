import type { z } from 'zod';
import type {
  getGuestOrderLookupRequestSchema,
  getGuestOrderLookupResponseSchema
} from '~/shared/schemas/api/checkout/guest-orders.schema';

export type GetGuestOrderLookupRequest = z.infer<typeof getGuestOrderLookupRequestSchema>;
export type GetGuestOrderLookupResponse = z.infer<typeof getGuestOrderLookupResponseSchema>;
