import { FetchError } from 'ofetch';
import { getBackendErrorCode, getBackendErrorMessage } from '~/shared/utils/backend-error';

/**
 * The apply-time copy for each server code. A sentence, unlike the picker's
 * terse disabled-row labels, because an apply failure is shown as the field's
 * inline error rather than under an offer card. The evaluator's per-reason
 * rejections carry a distinct code so the client can say why precisely
 * (exhausted, wrong products, minimum not met) instead of the one-size message.
 */
const APPLY_CODE_MESSAGE: Record<string, string> = {
  PROMOTION_CODE_NOT_FOUND: 'Promo code not found',
  PROMOTION_NOT_STARTED: 'This promo code is not active yet',
  PROMOTION_EXPIRED: 'This promo code has ended',
  PROMOTION_USAGE_LIMIT_REACHED: 'This promo code has been fully redeemed',
  PROMOTION_USER_USAGE_LIMIT_REACHED: 'You have already used this promo code',
  PROMOTION_AUTHENTICATION_REQUIRED: 'Sign in to use this promo code',
  PROMOTION_PRODUCT_SCOPE_MISMATCH: 'This promo code does not apply to the items in your cart',
  PROMOTION_MIN_ORDER_VALUE_NOT_MET: 'Your cart does not meet this promo code\'s minimum spend',
  PROMOTION_MIN_PRODUCTS_NOT_MET: 'Add more eligible items to use this promo code',
  PROMOTION_ZERO_BENEFIT: 'This promo code gives no savings on your cart',
  PROMOTION_SLOT_CONFLICT: 'This promo code cannot be combined with the selected promotion codes',
  PROMOTION_CURRENCY_CONVERSION_UNAVAILABLE: 'This promo code cannot be applied in this currency',
};

/**
 * Maps a promo code apply/pricing failure to the inline message the picker
 * shows. The server's exact code is rendered with precise copy; a code the
 * client does not know yet falls back to the server's own message, and any
 * other failure still surfaces a message so the picker never closes silently.
 */
export function resolvePromoCodeErrorMessage(error: unknown): string {
  const code = getBackendErrorCode(error);
  const knownCopy = code ? APPLY_CODE_MESSAGE[code] : undefined;

  if (knownCopy) {
    return knownCopy;
  }

  if (error instanceof FetchError) {
    return getBackendErrorMessage(error) ?? 'Promo code cannot be applied';
  }

  return 'Add promo code failed';
}
