import type { z } from 'zod';
import type {
  changeShopFinanceSettlementCurrencyRequestSchema,
  shopFinanceSettlementCurrencyChangeSchema,
  shopFinanceSettlementCurrencySchema,
} from '@arc/schemas/api/shop/finance/settlement-currency.schema';

export type ShopFinanceSettlementCurrency = z.infer<typeof shopFinanceSettlementCurrencySchema>;
export type ShopFinanceSettlementCurrencyBlockedReason = NonNullable<
  ShopFinanceSettlementCurrency['blocked_reason']
>;
export type ChangeShopFinanceSettlementCurrencyRequest = z.infer<
  typeof changeShopFinanceSettlementCurrencyRequestSchema
>;
export type ShopFinanceSettlementCurrencyChange = z.infer<
  typeof shopFinanceSettlementCurrencyChangeSchema
>;
