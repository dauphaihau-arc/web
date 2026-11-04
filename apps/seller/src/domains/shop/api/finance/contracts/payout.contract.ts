import type { components } from '@arc/schemas/api/generated/openapi';
import type { z } from 'zod';
import type {
  getShopFinancePayoutQuoteRequestSchema,
  shopFinancePayoutHistorySchema,
  shopFinancePayoutSchema,
} from '@arc/schemas/api/shop/finance/payout.schema';

/**
 * `ShopPayoutResponseDto` types the frozen-quote money fields (`fx_rate`,
 * `target_amount_minor`, `target_currency`, `paid_at`, …) as
 * `Record<string, unknown> | null`, so the history row stays hand-written.
 * The quote response is fully typed by the contract and the quote query keeps
 * its snake_case `amount_minor` (the contract still spells it `amountMinor`).
 */
export type ShopFinancePayout = z.infer<typeof shopFinancePayoutSchema>;
export type ShopFinancePayoutHistory = z.infer<typeof shopFinancePayoutHistorySchema>;
export type ShopFinancePayoutQuote = components['schemas']['ShopPayoutQuoteResponseDto'];
export type GetShopFinancePayoutQuoteRequest = z.infer<
  typeof getShopFinancePayoutQuoteRequestSchema
>;
