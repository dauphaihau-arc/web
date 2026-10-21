import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const shopFinancePayoutStates = ['pending', 'paid', 'blocked', 'failed'] as const

export const shopFinancePayoutStateSchema = z.enum(shopFinancePayoutStates)

/** A scheduled payout runs automatically; a manual one was requested by the seller. */
export const shopFinancePayoutSources = ['scheduled', 'manual'] as const

export const shopFinancePayoutSourceSchema = z.enum(shopFinancePayoutSources)

/**
 * A Payout made to the shop's Payout Account. Amounts are integer minor units in
 * the shop's Settlement Currency; `paid_at` is null until the provider accepts
 * the transfer. `period` is the platform month (`YYYY-MM`) the payout belongs
 * to, and is null on older payouts recorded before periods existed.
 */
export const shopFinancePayoutSchema = z.object({
  id: idSchema,
  amount_minor: z.number().int(),
  currency: z.string(),
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
