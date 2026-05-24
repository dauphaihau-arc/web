import { z } from 'zod';
import { getOrderShopsResponseSchema } from '~/shared/schemas/api/me/order/order.schema';

export const getGuestOrderLookupRequestSchema = z.object({
  email: z.string().email().optional(),
  order_id: z.string().optional(),
  order_ids: z.string().optional(),
  session_id: z.string().optional(),
  token: z.string().optional(),
  zip: z.string().optional(),
});

export const getGuestOrderLookupResponseSchema = getOrderShopsResponseSchema;
