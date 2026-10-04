export const COUPON_CONFIG = {
  MIN_CHAR_CODE: 6,
  MAX_CHAR_CODE: 12,
  MAX_AMOUNT_OFF: 100000000,
  MAX_USES: 100000,
  MAX_USE_PER_ORDER: 2,
  MIN_USES_PER_USER: 1,
  MAX_USES_PER_USER: 5,
  MAX_PERCENTAGE_OFF: 75,
  AMOUNT_DAYS_WARN_END_SALE: 7,
}

export enum CouponAppliesTo {
  ALL = 'all',
  SPECIFIC = 'specific',
}

export enum CouponTypes {
  FIXED_AMOUNT = 'fixed_amount',
  PERCENTAGE = 'percentage',
  FREE_SHIP = 'free_ship',
}

export enum CouponMinOrderTypes {
  NONE = 'none',
  NUMBER_OF_PRODUCTS = 'number_of_products',
  ORDER_TOTAL = 'order_total',
}

export enum CouponStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export enum CouponVisibility {
  PUBLIC = 'public',
  CODE_ONLY = 'code_only',
}

/**
 * Why a listed shop coupon cannot be applied to the buyer's current cart.
 * `null` on the wire means the coupon is eligible.
 */
export enum CouponIneligibleReason {
  NOT_STARTED = 'not_started',
  EXPIRED = 'expired',
  INACTIVE = 'inactive',
  USAGE_LIMIT_REACHED = 'usage_limit_reached',
  USER_USAGE_LIMIT_REACHED = 'user_usage_limit_reached',
  AUTHENTICATION_REQUIRED = 'authentication_required',
  PRODUCT_SCOPE = 'product_scope',
  MIN_ORDER_VALUE = 'min_order_value',
  MIN_PRODUCTS = 'min_products',
  ZERO_BENEFIT = 'zero_benefit',
}
