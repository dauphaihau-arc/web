import { z } from 'zod'

/**
 * The shop's payout behaviour. Auto payout is opt-in and runs on
 * `auto_payout_day_of_month` of each platform month (UTC). Manual withdrawal is
 * limited to once per shop per platform month unless
 * `manual_withdrawals_remaining` is null, which means unlimited.
 */
export const autoPayoutIneligibleReasons = [
  'no_payout_account',
  'payout_account_unverified',
  'payout_account_disabled',
  'payout_account_currency_mismatch',
  'settlement_currency_unresolved',
] as const

export const shopFinancePayoutSettingsSchema = z.object({
  auto_payout_enabled: z.boolean(),
  auto_payout_day_of_month: z.number().int().min(1).max(31),
  auto_payout_eligible: z.boolean(),
  auto_payout_ineligible_reason: z.enum(autoPayoutIneligibleReasons).nullable(),
  manual_withdrawals_remaining: z.number().int().min(0).nullable(),
})

/** Auto payout is the only seller-editable setting. */
export const updateShopFinancePayoutSettingsRequestSchema = z.object({
  auto_payout_enabled: z.boolean(),
})
