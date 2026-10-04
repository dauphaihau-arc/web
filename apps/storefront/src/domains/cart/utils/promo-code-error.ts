import { PromoCodeIneligibleReason } from '@arc/enums/promotion';
import { StatusCodes } from 'http-status-codes';
import { FetchError } from 'ofetch';

/**
 * The apply-time copy for each server reason. A sentence, unlike the picker's
 * terse disabled-row labels, because an apply failure is shown as the field's
 * inline error rather than under an offer card.
 */
const APPLY_REASON_MESSAGE: Record<PromoCodeIneligibleReason, string> = {
  [PromoCodeIneligibleReason.NOT_STARTED]: 'This promo code is not active yet',
  [PromoCodeIneligibleReason.EXPIRED]: 'This promo code has ended',
  [PromoCodeIneligibleReason.USAGE_LIMIT_REACHED]: 'This promo code has been fully redeemed',
  [PromoCodeIneligibleReason.USER_USAGE_LIMIT_REACHED]: 'You have already used this promo code',
  [PromoCodeIneligibleReason.AUTHENTICATION_REQUIRED]: 'Sign in to use this promo code',
  [PromoCodeIneligibleReason.PRODUCT_SCOPE]: 'This promo code does not apply to the items in your cart',
  [PromoCodeIneligibleReason.MIN_ORDER_VALUE]: 'Your cart does not meet this promo code\'s minimum spend',
  [PromoCodeIneligibleReason.MIN_PRODUCTS]: 'Add more eligible items to use this promo code',
  [PromoCodeIneligibleReason.ZERO_BENEFIT]: 'This promo code gives no savings on your cart',
};

/**
 * Maps a promo code apply/pricing failure to the inline message the picker
 * shows. A 422 carrying the evaluator's `reason` is rendered with precise copy;
 * an older or unknown server falls back to its message, and any other failure
 * still surfaces a message so the picker never closes silently.
 */
export function resolvePromoCodeErrorMessage(error: unknown): string {
  if (error instanceof FetchError) {
    if (error.status === StatusCodes.NOT_FOUND) {
      return 'Promo code not found';
    }
    if (error.status === StatusCodes.UNPROCESSABLE_ENTITY) {
      const reason = (error.data as { reason?: string } | undefined)?.reason;

      if (reason && reason in APPLY_REASON_MESSAGE) {
        return APPLY_REASON_MESSAGE[reason as PromoCodeIneligibleReason];
      }

      return (error.data as { message?: string } | undefined)?.message ??
        'Promo code cannot be applied';
    }
  }
  return 'Add promo code failed';
}
