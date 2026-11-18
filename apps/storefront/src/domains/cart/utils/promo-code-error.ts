import { FetchError } from 'ofetch';
import { getBackendErrorCode } from '~/shared/utils/backend-error';
import {
  translateError,
  type ErrorTranslator,
} from '~/shared/utils/api-error-copy';

/**
 * The apply-time copy for each server code. A sentence, unlike the picker's
 * terse disabled-row labels, because an apply failure is shown as the field's
 * inline error rather than under an offer card. The evaluator's per-reason
 * rejections carry a distinct code so the client can say why precisely
 * (exhausted, wrong products, minimum not met) instead of the one-size message.
 */
const APPLY_CODE_KEY: Record<string, string> = {
  PROMOTION_CODE_NOT_FOUND: 'errors.promo.codeNotFound',
  PROMOTION_NOT_STARTED: 'errors.promo.notStarted',
  PROMOTION_EXPIRED: 'errors.promo.expired',
  PROMOTION_USAGE_LIMIT_REACHED: 'errors.promo.usageLimitReached',
  PROMOTION_USER_USAGE_LIMIT_REACHED: 'errors.promo.userUsageLimitReached',
  PROMOTION_AUTHENTICATION_REQUIRED: 'errors.promo.authenticationRequired',
  PROMOTION_PRODUCT_SCOPE_MISMATCH: 'errors.promo.productScopeMismatch',
  PROMOTION_MIN_ORDER_VALUE_NOT_MET: 'errors.promo.minOrderValueNotMet',
  PROMOTION_MIN_PRODUCTS_NOT_MET: 'errors.promo.minProductsNotMet',
  PROMOTION_ZERO_BENEFIT: 'errors.promo.zeroBenefit',
  PROMOTION_SLOT_CONFLICT: 'errors.promo.slotConflict',
  PROMOTION_CURRENCY_CONVERSION_UNAVAILABLE: 'errors.promo.currencyConversionUnavailable',
};

/**
 * Maps a promo code apply/pricing failure to the inline message the picker
 * shows. A known server code renders precise localized copy; an unknown code
 * renders the shared generic error rather than the server's English message.
 * Responses that never reached the server keep the action-specific fallback so
 * the picker never closes silently.
 */
export function resolvePromoCodeErrorMessage(
  error: unknown,
  t: ErrorTranslator = translateError,
): string {
  const code = getBackendErrorCode(error);
  const knownKey = code ? APPLY_CODE_KEY[code] : undefined;

  if (knownKey) {
    return t(knownKey);
  }

  if (error instanceof FetchError) {
    return t('errors.generic.title');
  }

  return t('errors.promo.applyFailed');
}
