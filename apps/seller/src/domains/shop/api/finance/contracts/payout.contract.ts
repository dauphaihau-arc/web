import type { z } from 'zod';
import type {
  getShopFinancePayoutQuoteRequestSchema,
  shopFinancePayoutHistorySchema,
  shopFinancePayoutQuoteSchema,
  shopFinancePayoutSchema,
} from '@arc/schemas/api/shop/finance/payout.schema';

export type ShopFinancePayout = z.infer<typeof shopFinancePayoutSchema>;
export type ShopFinancePayoutHistory = z.infer<typeof shopFinancePayoutHistorySchema>;
export type ShopFinancePayoutQuote = z.infer<typeof shopFinancePayoutQuoteSchema>;
export type GetShopFinancePayoutQuoteRequest = z.infer<
  typeof getShopFinancePayoutQuoteRequestSchema
>;
