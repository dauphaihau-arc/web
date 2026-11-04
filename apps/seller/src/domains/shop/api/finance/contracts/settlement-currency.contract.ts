import type { components } from '@arc/schemas/api/generated/openapi';
import type { z } from 'zod';
import type {
  changeShopFinanceSettlementCurrencyRequestSchema,
  shopFinanceSettlementCurrencySchema,
} from '@arc/schemas/api/shop/finance/settlement-currency.schema';

/**
 * `ShopSettlementCurrencyResponseDto` types `previous_currency` and
 * `next_change_allowed_at` as `Record<string, unknown> | null`, so the read
 * model stays hand-written. The change request keeps its snake_case
 * `currency: string` (the contract narrows it to the marketplace currency set).
 */
export type ShopFinanceSettlementCurrency = z.infer<typeof shopFinanceSettlementCurrencySchema>;
export type ShopFinanceSettlementCurrencyBlockedReason = NonNullable<
  ShopFinanceSettlementCurrency['blocked_reason']
>;
export type ChangeShopFinanceSettlementCurrencyRequest = z.infer<
  typeof changeShopFinanceSettlementCurrencyRequestSchema
>;
export type ShopFinanceSettlementCurrencyChange =
  components['schemas']['ShopSettlementCurrencyChangeResponseDto'];
