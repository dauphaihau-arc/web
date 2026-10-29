import type { z } from 'zod';
import type {
  shopOrderPayoutAvailabilitySchema,
  shopOrderPayoutMethodSchema,
  shopOrderPayoutSchema,
  shopOrderPayoutSummarySchema,
} from '@arc/schemas/api/shop/finance/order-payout.schema';

export type ShopOrderPayout = z.infer<typeof shopOrderPayoutSchema>;
export type ShopOrderPayoutAvailability = z.infer<typeof shopOrderPayoutAvailabilitySchema>;
export type ShopOrderPayoutMethod = z.infer<typeof shopOrderPayoutMethodSchema>;
export type ShopOrderPayoutSummary = z.infer<typeof shopOrderPayoutSummarySchema>;
