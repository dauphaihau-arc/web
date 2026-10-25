import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const shopFinancePayoutStates = ['pending', 'paid', 'blocked', 'failed'] as const

export const shopFinancePayoutStateSchema = z.enum(shopFinancePayoutStates)

/** A scheduled payout runs automatically; a manual one was requested by the seller. */
export const shopFinancePayoutSources = ['scheduled', 'manual'] as const

export const shopFinancePayoutSourceSchema = z.enum(shopFinancePayoutSources)

/**
 * A Payout made to the shop's Payout Account. `amount_minor` is the integer
 * minor-unit amount that left the seller balance, in `currency` (the shop's
 * Settlement Currency); `paid_at` is null until the provider accepts the
 * transfer. `period` is the platform month (`YYYY-MM`) the payout belongs to,
 * and is null on older payouts recorded before periods existed.
 *
 * The provider reports the conversion when the transfer settles, so
 * `provider_fx_rate` and `target_amount_minor` stay null until then.
 * `fx_rate` is the claim-time estimate, and `fx_fee_minor` the historical fee;
 * all of them are null on payouts that predate the frozen quote and
 * `target_currency` then equals `currency`. A same-currency payout records rate
 * `'1'` and the same target amount.
 */
export const shopFinancePayoutSchema = z.object({
  id: idSchema,
  amount_minor: z.number().int(),
  currency: z.string(),
  /** The currency the amount left the balance in. */
  source_currency: z.string().nullable(),
  /** The currency that landed in the Payout Account. */
  target_currency: z.string().nullable(),
  /** The claim-time conversion rate estimate, as text. */
  fx_rate: z.string().nullable(),
  /** What the provider transfers, in `target_currency` minor units. */
  target_amount_minor: z.number().int().nullable(),
  /**
   * The rate the provider applied, as text exactly as reported. Authoritative
   * and preferred over `fx_rate`; null until the transfer reports one.
   */
  provider_fx_rate: z.string().nullable(),
  /** The disclosed conversion fee, in `source_currency` minor units. */
  fx_fee_minor: z.number().int().nullable(),
  state: shopFinancePayoutStateSchema,
  source: shopFinancePayoutSourceSchema,
  period: z.string().regex(/^\d{4}-\d{2}$/).nullable(),
  reason: z.string().nullable(),
  paid_at: z.union([z.string(), z.date()]).nullable(),
  created_at: z.union([z.string(), z.date()]),
})

/** The shop's Payouts, newest first. */
export const shopFinancePayoutHistorySchema = z.object({
  payouts: z.array(shopFinancePayoutSchema),
})

/**
 * A seller-requested withdrawal. Omit `amount_minor` to withdraw the whole net
 * available balance; when present it is an integer number of minor units.
 */
export const requestShopFinanceManualPayoutRequestSchema = z.object({
  amount_minor: z.number().int().positive().optional(),
})

export const shopFinanceManualPayoutResponseSchema = z.object({
  payout: shopFinancePayoutSchema,
})

/**
 * The seller-facing preview of one withdrawal: what leaves the shop balance and
 * what is expected to land in the Payout Account. Nothing is persisted; the
 * number is an estimate and the provider reports the amount it actually sent.
 */
export const shopFinancePayoutQuoteSchema = z.object({
  source_currency: z.string(),
  target_currency: z.string(),
  source_amount_minor: z.number().int(),
  fx_rate: z.string(),
  target_amount_minor: z.number().int(),
  /** Always true: the panel never claims the amount is settled. */
  estimated: z.literal(true),
})

/** Query of the withdrawal quote; the shop-currency amount is required. */
export const getShopFinancePayoutQuoteRequestSchema = z.object({
  amount_minor: z.number().int().positive(),
})
