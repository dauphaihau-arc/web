import type { z } from 'zod';
import type {
  saveShopFinancePayoutAccountRequestSchema,
  shopFinancePayoutAccountResponseSchema,
  shopFinancePayoutAccountSchema,
} from '@arc/schemas/api/shop/finance/payout-account.schema';

export type ShopFinancePayoutAccount = z.infer<typeof shopFinancePayoutAccountSchema>;
export type ShopFinancePayoutAccountResponse = z.infer<typeof shopFinancePayoutAccountResponseSchema>;
export type SaveShopFinancePayoutAccountRequestBody = z.infer<typeof saveShopFinancePayoutAccountRequestSchema>;
