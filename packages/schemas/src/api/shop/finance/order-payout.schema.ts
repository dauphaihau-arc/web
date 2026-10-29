import { z } from 'zod'
import { payoutAccountStatuses } from '@arc/schemas/api/shop/finance/payout-account.schema'
import { idSchema } from '@arc/schemas/primitives/id.schema'

/** A payout attributable to one Order is either still processing or paid. */
export const shopOrderPayoutStates = ['pending', 'paid'] as const

export const shopOrderPayoutStateSchema = z.enum(shopOrderPayoutStates)

/**
 * Whether the Order's money has been released. Availability is owned by
 * Finance and follows delivery of every required unit; `available_at` is null
 * until that is recorded.
 */
export const shopOrderPayoutAvailabilitySchema = z.object({
  recorded: z.boolean(),
  available_at: z.union([z.string(), z.date()]).nullable(),
})

/**
 * The most recent payout attributable to the Order. `amount_minor` is only
 * this Order's share, in the Order currency; `paid_at` stays null while the
 * payout is still pending.
 */
export const shopOrderPayoutSummarySchema = z.object({
  id: idSchema,
  state: shopOrderPayoutStateSchema,
  amount_minor: z.number().int(),
  paid_at: z.union([z.string(), z.date()]).nullable(),
})

/**
 * Where the Order's payout would go and when Finance would release it.
 * `missing` means the shop has no usable Payout Account; every other value is
 * the provider's account status. `next_payout_date` is a UTC calendar date
 * (`YYYY-MM-DD`) for the next automatic run, and null when no run is scheduled
 * because auto payout is off or the account cannot receive money yet.
 */
export const shopOrderPayoutMethodAccountStatuses = ['missing', ...payoutAccountStatuses] as const

export const shopOrderPayoutMethodAccountStatusSchema = z.enum(
  shopOrderPayoutMethodAccountStatuses,
)

export const shopOrderPayoutMethodSchema = z.object({
  account_status: shopOrderPayoutMethodAccountStatusSchema,
  auto_payout_enabled: z.boolean(),
  auto_payout_day_of_month: z.number().int().min(1).max(31),
  next_payout_date: z.string().nullable(),
})

/**
 * The payout fact for one Order, composed by Finance from the journal,
 * Payout Availability, and Payout records. `seller_payable_minor` is null when
 * the Order has no paid journal basis (refunds already netted).
 */
export const shopOrderPayoutSchema = z.object({
  order_id: idSchema,
  currency: z.string(),
  seller_payable_minor: z.number().int().nullable(),
  availability: shopOrderPayoutAvailabilitySchema,
  payout: shopOrderPayoutSummarySchema.nullable(),
  payout_method: shopOrderPayoutMethodSchema,
})
