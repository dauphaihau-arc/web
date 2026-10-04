/**
 * Seller-facing Promotion vocabulary. A Promotion is either an automatic
 * percentage Sale or a conditional Checkout Discount activated by a Promo Code.
 */
export enum PromotionApplicationKind {
  SALE = 'sale',
  CHECKOUT_DISCOUNT = 'checkout_discount',
}

export enum PromotionBenefitType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
}

export enum PromotionProductScope {
  ALL = 'all',
  SPECIFIC = 'specific',
}

/**
 * The condition a Checkout Discount places on the buyer's checkout. A Sale is
 * unconditional and always uses `none`. `order_total` compares the Eligible
 * Merchandise Subtotal after Sale pricing and before Promo Code discounts;
 * `purchase_quantity` counts eligible merchandise units, not distinct Products.
 */
export enum PromotionMinOrderType {
  NONE = 'none',
  PURCHASE_QUANTITY = 'purchase_quantity',
  ORDER_TOTAL = 'order_total',
}

export enum PromotionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export const PROMO_CODE_CONFIG = {
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

/**
 * Why a listed Promo Code cannot be redeemed on the buyer's current cart.
 * `null` on the wire means the Promo Code is eligible.
 */
export enum PromoCodeIneligibleReason {
  NOT_STARTED = 'not_started',
  EXPIRED = 'expired',
  USAGE_LIMIT_REACHED = 'usage_limit_reached',
  USER_USAGE_LIMIT_REACHED = 'user_usage_limit_reached',
  AUTHENTICATION_REQUIRED = 'authentication_required',
  PRODUCT_SCOPE = 'product_scope',
  MIN_ORDER_VALUE = 'min_order_value',
  MIN_PRODUCTS = 'min_products',
  ZERO_BENEFIT = 'zero_benefit',
}
