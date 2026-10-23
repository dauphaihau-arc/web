import { z } from 'zod'

/**
 * Why the shop cannot change its Settlement Currency right now. The server owns
 * the decision; the UI only reflects it.
 */
export const shopFinanceSettlementCurrencyBlockedReasonSchema = z.enum([
  'balance_not_zero',
  'payout_pending',
  'change_too_soon',
])

/**
 * The shop's Settlement Currency, read from its dated history. `previous_currency`
 * is null on the shop's opening currency, and `next_change_allowed_at` is null
 * until a change has happened.
 */
export const shopFinanceSettlementCurrencySchema = z.object({
  currency: z.string(),
  effective_from: z.string(),
  previous_currency: z.string().nullable(),
  change_interval_days: z.number().int().min(1),
  next_change_allowed_at: z.string().nullable(),
  auto_payout_enabled: z.boolean(),
  can_change: z.boolean(),
  blocked_reason: shopFinanceSettlementCurrencyBlockedReasonSchema.nullable(),
  available_minor: z.number().int(),
  not_yet_available_minor: z.number().int(),
  pending_payout: z.boolean(),
})

/** The currency the seller asks to move the shop to. */
export const changeShopFinanceSettlementCurrencyRequestSchema = z.object({
  currency: z.string().trim().length(3),
})

/** The granted change: the resulting currency, its effective instant, and auto payout. */
export const shopFinanceSettlementCurrencyChangeSchema = z.object({
  currency: z.string(),
  previous_currency: z.string(),
  effective_from: z.string(),
  auto_payout_enabled: z.boolean(),
})
