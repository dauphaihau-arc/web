import {
  PromoCodeIneligibleReason,
  PromotionBenefitType,
  PromotionMinOrderType,
} from '@arc/enums/promotion';
import type { MarketCurrencies } from '@arc/enums/market';
import formatCurrency from '@arc/utils/format-currency';
import dayjs from 'dayjs';
import type { CartPromoCodeItem } from '~/domains/cart/api/contracts/cart.contract';

const EXPIRATION_FORMAT = 'MMM DD, YYYY';

/**
 * Turns the minimal public promo code offer into the three English display lines
 * the picker renders. Money values arrive in major units already resolved in the
 * buyer's checkout currency, so they are formatted directly and never scaled.
 */
export function formatPromoCodeDiscount(promoCode: CartPromoCodeItem): string {
  if (promoCode.benefit_type === PromotionBenefitType.FREE_SHIPPING) {
    return 'Free shipping';
  }

  if (promoCode.benefit_type === PromotionBenefitType.PERCENTAGE) {
    return promoCode.percent_off == null ? 'Discount' : `${promoCode.percent_off}% off`;
  }

  return promoCode.amount_off == null
    ? 'Discount'
    : `${formatCurrency(promoCode.amount_off, promoCode.currency as MarketCurrencies)} off`;
}

export function formatPromoCodeMinimum(promoCode: CartPromoCodeItem): string {
  if (promoCode.min_order_type === PromotionMinOrderType.ORDER_TOTAL) {
    return promoCode.min_order_value == null
      ? 'No minimum'
      : `Minimum spend ${formatCurrency(promoCode.min_order_value, promoCode.currency as MarketCurrencies)}`;
  }

  if (promoCode.min_order_type === PromotionMinOrderType.PURCHASE_QUANTITY) {
    return promoCode.min_purchase_quantity == null
      ? 'No minimum quantity'
      : `Minimum quantity ${promoCode.min_purchase_quantity}`;
  }

  return 'No minimum';
}

export function formatPromoCodeExpiration(promoCode: CartPromoCodeItem): string {
  const expiresAt = dayjs(promoCode.end_date);
  return expiresAt.isValid() ? `Expires ${expiresAt.format(EXPIRATION_FORMAT)}` : '';
}

const INELIGIBLE_REASON_MESSAGE: Record<PromoCodeIneligibleReason, string> = {
  [PromoCodeIneligibleReason.EXPIRED]: 'Expired',
  [PromoCodeIneligibleReason.NOT_STARTED]: 'Not started yet',
  [PromoCodeIneligibleReason.USAGE_LIMIT_REACHED]: 'Fully redeemed',
  [PromoCodeIneligibleReason.USER_USAGE_LIMIT_REACHED]: 'You have used this promo code',
  [PromoCodeIneligibleReason.AUTHENTICATION_REQUIRED]: 'Sign in to use this promo code',
  [PromoCodeIneligibleReason.PRODUCT_SCOPE]: 'Not applicable to items in this cart',
  [PromoCodeIneligibleReason.MIN_ORDER_VALUE]: 'Add more to use this promo code',
  [PromoCodeIneligibleReason.MIN_PRODUCTS]: 'Add more items to use this promo code',
  [PromoCodeIneligibleReason.ZERO_BENEFIT]: 'No saving on this cart',
};

/**
 * Plain-English reason shown under the three display lines for a promo code the
 * buyer cannot use yet. Returns an empty string when the promo code is eligible,
 * so the picker renders no reason line in that case.
 */
export function formatPromoCodeIneligibleReason(reason: CartPromoCodeItem['ineligible_reason']): string {
  return reason == null ? '' : INELIGIBLE_REASON_MESSAGE[reason];
}
