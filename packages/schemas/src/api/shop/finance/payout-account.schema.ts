import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const payoutAccountStatuses = ['pending', 'active', 'disabled'] as const

export const payoutAccountStatusSchema = z.enum(payoutAccountStatuses)

/** The masked Payout Account returned by the seller finance endpoints. */
export const shopFinancePayoutAccountSchema = z.object({
  id: idSchema,
  holder_name: z.string(),
  bank_name: z.string(),
  last4: z.string(),
  country: z.string(),
  currency: z.string(),
  status: payoutAccountStatusSchema,
  verified_at: z.union([z.string(), z.date()]).nullable(),
})

/** The account reference is write-only; responses contain only its last four characters. */
export const saveShopFinancePayoutAccountRequestSchema = z.object({
  holder_name: z.string().trim().min(1).max(255),
  bank_name: z.string().trim().min(1).max(255),
  country: z.string().regex(/^[A-Z]{2}$/, 'Choose a two-letter country code'),
  account_reference: z.string()
    .min(4, 'Use at least 4 characters')
    .max(34, 'Use at most 34 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Use only letters, digits and dashes'),
})

export const shopFinancePayoutAccountResponseSchema = z.object({
  payout_account: shopFinancePayoutAccountSchema.nullable(),
})
