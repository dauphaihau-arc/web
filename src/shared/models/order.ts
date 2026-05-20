import type { z } from 'zod';
import type {
  orderProductSchema,
  orderSchema
} from '~/shared/schemas/order.schema';

export type Order = z.infer<typeof orderSchema>;
export type OrderShopProduct = z.infer<typeof orderProductSchema>;
