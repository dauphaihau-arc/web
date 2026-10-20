import type { z } from 'zod';
import type {
  shopFinancePayoutHistorySchema,
  shopFinancePayoutSchema,
} from '@arc/schemas/api/shop/finance/payout.schema';

export type ShopFinancePayout = z.infer<typeof shopFinancePayoutSchema>;
export type ShopFinancePayoutHistory = z.infer<typeof shopFinancePayoutHistorySchema>;
