import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const shopFinancePayoutStates = ['pending', 'paid', 'blocked', 'failed'] as const

export const shopFinancePayoutStateSchema = z.enum(shopFinancePayoutStates)

/**
 * A Payout made to the shop's Payout Account. Amounts are integer minor units in
 * the shop's Settlement Currency; `paid_at` is null until the provider accepts
 * the transfer.
 */
export const shopFinancePayoutSchema = z.object({
  id: idSchema,
  amount_minor: z.number().int(),
  currency: z.string(),
  state: shopFinancePayoutStateSchema,
  paid_at: z.union([z.string(), z.date()]).nullable(),
  created_at: z.union([z.string(), z.date()]),
})

/** The shop's Payouts, newest first. */
export const shopFinancePayoutHistorySchema = z.object({
  payouts: z.array(shopFinancePayoutSchema),
})
