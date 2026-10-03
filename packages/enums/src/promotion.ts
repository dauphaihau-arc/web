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
