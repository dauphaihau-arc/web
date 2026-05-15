import type { z } from 'zod';
import type { orderSchema, orderProductSchema } from '~/schemas/order.schema';

export type Order = z.infer<typeof orderSchema>;

export type OrderShopProduct = z.infer<typeof orderProductSchema>;
