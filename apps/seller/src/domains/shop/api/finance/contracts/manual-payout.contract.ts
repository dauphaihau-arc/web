import type { z } from 'zod';
import type {
  requestShopFinanceManualPayoutRequestSchema,
  shopFinanceManualPayoutResponseSchema,
} from '@arc/schemas/api/shop/finance/payout.schema';

export type RequestShopFinanceManualPayoutRequest = z.infer<
  typeof requestShopFinanceManualPayoutRequestSchema
>;
export type ShopFinanceManualPayoutResponse = z.infer<
  typeof shopFinanceManualPayoutResponseSchema
>;
