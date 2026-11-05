import type { components } from '@arc/schemas/api/generated/openapi';

/**
 * An operator's read of a shop's money facts. The admin finance endpoints
 * serialize the shop-facing payloads unchanged, in the shop's Settlement
 * Currency and integer minor units, so these types stay separate from the
 * seller finance contracts that the seller app consumes.
 *
 * `state` is a plain string: the API owns its value set, and the presentation
 * helpers fall back to the raw value for any state this app does not know yet.
 * The Payout `source` and the Payout Account `status` carry the contract's own
 * unions.
 */

/** The shop's Seller Payable balance, in its Settlement Currency. */
export type AdminShopPayable = components['schemas']['ShopSellerPayableResponseDto'];

/** One Payout, with the frozen quote and the provider's conversion evidence. */
export type AdminShopPayout = components['schemas']['ShopPayoutResponseDto'];

/** The shop Payout history envelope; `payouts` is newest first. */
export type AdminShopPayoutsResponse = components['schemas']['ShopPayoutHistoryResponseDto'];

/** What the payout provider still needs from the account. */
export type AdminPayoutAccountRequirements =
  components['schemas']['PayoutAccountRequirementsResponse'];

/**
 * A shop's active Payout Account. It carries the provider's account id and
 * display-only bank metadata; no bank number, routing number or holder name is
 * stored, so there is nothing to mask.
 */
export type AdminPayoutAccount = components['schemas']['PayoutAccountResponseDto'];

/** The admin Payout Account read; `payout_account` is null when not onboarded. */
export type AdminShopPayoutAccountResponse =
  components['schemas']['AdminShopPayoutAccountResponseDto'];

/** A recorded Commission Schedule: the rate takes effect from `effective_from`. */
export type AdminCommissionSchedule = components['schemas']['CommissionScheduleResponseDto'];

/** Body of the Commission Schedule record/replace endpoint. */
export type RecordCommissionScheduleBody = components['schemas']['RecordCommissionScheduleDto'];

/** The Commission Schedule in force right now, if the shop has one. */
export type AdminShopCurrentCommissionSchedule =
  components['schemas']['CurrentCommissionScheduleResponseDto'];

/**
 * The admin read of the Commission Schedule in force: entries whose
 * `effective_from` is in the future are not included, so `schedule` is null
 * until the first one takes effect.
 */
export type AdminShopCommissionScheduleResponse =
  components['schemas']['AdminShopCommissionScheduleResponseDto'];
