import { z } from 'zod'
import { idSchema } from '@arc/schemas/primitives/id.schema'

export const payoutAccountStatuses = [
  'onboarding',
  'action_required',
  'active',
  'restricted',
  'disabled',
] as const

export const payoutAccountStatusSchema = z.enum(payoutAccountStatuses)

/**
 * What the provider still needs from the seller, and why it has stopped paying
 * them. Both values come from Stripe verbatim; the HTTP surface only renames
 * the fields.
 */
export const payoutAccountRequirementsSchema = z.object({
  currently_due: z.array(z.string()),
  disabled_reason: z.string().nullable(),
})

/**
 * A shop's Payout Account as the provider reports it. The bank name and last
 * four are display metadata; the full bank number and routing number are never
 * stored, because Stripe holds those details.
 */
export const shopFinancePayoutAccountSchema = z.object({
  id: idSchema,
  provider: z.string(),
  provider_account_id: z.string().nullable(),
  country: z.string(),
  currency: z.string(),
  status: payoutAccountStatusSchema,
  payouts_enabled: z.boolean(),
  charges_enabled: z.boolean(),
  transfers_capability: z.string().nullable(),
  requirements: payoutAccountRequirementsSchema.nullable(),
  default_currency: z.string().nullable(),
  bank_name: z.string().nullable(),
  last4: z.string().nullable(),
})

export const shopFinancePayoutAccountResponseSchema = z.object({
  payout_account: shopFinancePayoutAccountSchema.nullable(),
})

/**
 * The country where the seller's bank account is held. The provider decides
 * whether it can onboard there, so the API validates only the shape.
 */
export const startShopFinancePayoutAccountOnboardingRequestSchema = z.object({
  country: z.string().regex(/^[A-Za-z]{2}$/, 'Choose a two-letter country code'),
})

/**
 * The provider-hosted onboarding URL, or null for the local adapter which
 * activates the destination without a hosted flow.
 */
export const shopFinancePayoutAccountOnboardingResponseSchema = z.object({
  url: z.string().nullable(),
  status: payoutAccountStatusSchema,
})

/**
 * The countries the seller may choose when starting onboarding. The ops-owned
 * API allowlist is the only source; the picker never offers anything else.
 */
export const shopFinancePayoutAccountCountriesSchema = z.object({
  countries: z.array(z.string()),
})
