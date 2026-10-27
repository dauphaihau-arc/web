/**
 * An operator's read of a shop's money facts. The admin finance endpoints
 * serialize the shop-facing payloads unchanged, in the shop's Settlement
 * Currency and integer minor units, so these types stay separate from the
 * seller finance contracts that the seller app consumes.
 *
 * `state`, `source` and the Payout Account `status` are plain strings: the API
 * owns their value sets, and the presentation helpers fall back to the raw
 * value for any state this app does not know yet.
 */

/** The shop's Seller Payable balance, in its Settlement Currency. */
export interface AdminShopPayable {
  currency: string
  available_minor: number
  not_yet_available_minor: number
}

/** One Payout, with the frozen quote and the provider's conversion evidence. */
export interface AdminShopPayout {
  id: string
  payout_number: string
  /** Amount paid, in the shop Settlement Currency minor units. */
  amount_minor: number
  /** The shop Settlement Currency the Payout was made in. */
  currency: string
  /** The currency the amount left the balance in. */
  source_currency: string | null
  /** The currency the provider actually transferred in. */
  transfer_currency: string | null
  /** The transferred amount, in `transfer_currency` minor units. */
  transfer_amount_minor: number | null
  /** The currency that landed in the Payout Account. */
  target_currency: string | null
  /** The claim-time rate that converted `amount_minor`, as text. */
  fx_rate: string | null
  /** The amount that landed in `target_currency` minor units. */
  target_amount_minor: number | null
  /** The conversion rate the provider applied, as text exactly as reported. */
  provider_fx_rate: string | null
  /** The historical conversion fee, in `source_currency` minor units. */
  fx_fee_minor: number | null
  /** Lifecycle state of the Payout. */
  state: string
  /** Whether a scheduled run or a seller manual withdrawal created it. */
  source: string
  /** The platform month the Payout belongs to, as `YYYY-MM`. */
  period: string | null
  /** Why a Blocked or Failed Payout ended as it did. */
  reason: string | null
  /** Instant the provider accepted the transfer, or null while it has not. */
  paid_at: string | null
  created_at: string
}

/** The shop Payout history envelope; `payouts` is newest first. */
export interface AdminShopPayoutsResponse {
  payouts: AdminShopPayout[]
}

/** What the payout provider still needs from the account. */
export interface AdminPayoutAccountRequirements {
  currently_due: string[]
  disabled_reason: string | null
}

/**
 * A shop's active Payout Account. It carries the provider's account id and
 * display-only bank metadata; no bank number, routing number or holder name is
 * stored, so there is nothing to mask.
 */
export interface AdminPayoutAccount {
  id: string
  /** Payout adapter: `manual_bank` or `stripe_connect`. */
  provider: string
  provider_account_id: string | null
  /** ISO 3166-1 alpha-2 country code. */
  country: string
  /** The currency this destination is paid in. */
  currency: string
  /** Lifecycle status: onboarding, action_required, active, restricted, disabled. */
  status: string
  payouts_enabled: boolean
  charges_enabled: boolean
  transfers_capability: string | null
  requirements: AdminPayoutAccountRequirements | null
  default_currency: string | null
  bank_name: string | null
  last4: string | null
}

/** The admin Payout Account read; `payout_account` is null when not onboarded. */
export interface AdminShopPayoutAccountResponse {
  shop_id: string
  payout_account: AdminPayoutAccount | null
}

/** A recorded Commission Schedule: the rate takes effect from `effective_from`. */
export interface AdminCommissionSchedule {
  shop_id: string
  /** ISO-8601 instant the rate takes effect. */
  effective_from: string
  /** 1500 is 15.00%. */
  rate_basis_points: number
}

/** Body of the Commission Schedule record/replace endpoint. */
export interface RecordCommissionScheduleBody {
  effective_from: string
  rate_basis_points: number
}

/** The Commission Schedule in force right now, if the shop has one. */
export interface AdminShopCurrentCommissionSchedule {
  effective_from: string
  /** 1500 is 15.00%. */
  rate_basis_points: number
}

/**
 * The admin read of the Commission Schedule in force: entries whose
 * `effective_from` is in the future are not included, so `schedule` is null
 * until the first one takes effect.
 */
export interface AdminShopCommissionScheduleResponse {
  shop_id: string
  schedule: AdminShopCurrentCommissionSchedule | null
}
