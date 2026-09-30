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

export enum PromotionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}
