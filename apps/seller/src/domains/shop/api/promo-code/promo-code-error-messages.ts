/**
 * Seller-facing copy for the failures a Promo Code can be rejected with.
 *
 * The API answers with a stable `code`; the wording lives here so it can change
 * without a backend release. A code this map does not know falls back to the
 * server's own message, so a new API failure is still explained rather than
 * reduced to a generic apology.
 */
export const PROMO_CODE_ERROR_MESSAGES: Record<string, string> = {
  PROMO_CODE_ALREADY_EXISTS: 'Promo code already exists',
  PROMO_CODE_END_AFTER_START_REQUIRED: 'Choose an end that is after the start.',
  PROMO_CODE_LOCAL_TIME_NONEXISTENT:
    'That start or end time does not exist on the calendar in the selected timezone. Choose another time.',
  PROMO_CODE_LOCAL_TIME_AMBIGUOUS:
    'That start or end time happens twice in the selected timezone. Choose which occurrence to use.',
  PROMO_CODE_TIMEZONE_INVALID: 'Choose a valid timezone.',
  PROMO_CODE_SCHEDULE_INVALID: 'Check the start and end times and try again.',
  PROMO_CODE_BENEFIT_INVALID: 'Check the discount: choose a percentage or a fixed amount, but not both.',
  PROMO_CODE_CONDITION_INVALID: 'Check the minimum: choose no minimum, a minimum spend, or a minimum quantity, but not more than one.',
  PROMO_CODE_PRODUCT_SCOPE_INVALID:
    'Check the selected products: each must belong to your shop and be selected once.',
  SHOP_NOT_FOUND: 'We could not find your shop. Reload the page and try again.',
  SHOP_ACCESS_DENIED: 'You do not have permission to manage this shop.',
};
