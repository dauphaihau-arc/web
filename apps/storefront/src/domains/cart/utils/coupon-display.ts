import { CouponIneligibleReason, CouponMinOrderTypes, CouponTypes } from '@arc/enums/coupon';
import type { MarketCurrencies } from '@arc/enums/market';
import formatCurrency from '@arc/utils/format-currency';
import dayjs from 'dayjs';
import type { CartCouponItem } from '~/domains/cart/api/contracts/cart.contract';

const EXPIRATION_FORMAT = 'MMM DD, YYYY';

/**
 * Turns the minimal public coupon item into the three English display lines the
 * picker renders. Money values arrive in major units already resolved in the
 * buyer's checkout currency, so they are formatted directly and never scaled.
 */
export function formatCouponDiscount(coupon: CartCouponItem): string {
  if (coupon.type === CouponTypes.FREE_SHIP) {
    return 'Free shipping';
  }

  if (coupon.type === CouponTypes.PERCENTAGE) {
    return coupon.percent_off == null ? 'Discount' : `${coupon.percent_off}% off`;
  }

  return coupon.amount_off == null
    ? 'Discount'
    : `${formatCurrency(coupon.amount_off, coupon.currency as MarketCurrencies)} off`;
}

export function formatCouponMinimum(coupon: CartCouponItem): string {
  if (coupon.min_order_type === CouponMinOrderTypes.ORDER_TOTAL) {
    return coupon.min_order_value == null
      ? 'No minimum'
      : `Minimum spend ${formatCurrency(coupon.min_order_value, coupon.currency as MarketCurrencies)}`;
  }

  if (coupon.min_order_type === CouponMinOrderTypes.NUMBER_OF_PRODUCTS) {
    return coupon.min_products == null
      ? 'No minimum quantity'
      : `Minimum quantity ${coupon.min_products}`;
  }

  return 'No minimum';
}

export function formatCouponExpiration(coupon: CartCouponItem): string {
  const expiresAt = dayjs(coupon.end_date);
  return expiresAt.isValid() ? `Expires ${expiresAt.format(EXPIRATION_FORMAT)}` : '';
}

const INELIGIBLE_REASON_MESSAGE: Record<CouponIneligibleReason, string> = {
  [CouponIneligibleReason.EXPIRED]: 'Expired',
  [CouponIneligibleReason.NOT_STARTED]: 'Not started yet',
  [CouponIneligibleReason.INACTIVE]: 'Unavailable',
  [CouponIneligibleReason.USAGE_LIMIT_REACHED]: 'Fully redeemed',
  [CouponIneligibleReason.USER_USAGE_LIMIT_REACHED]: 'You have used this coupon',
  [CouponIneligibleReason.PRODUCT_SCOPE]: 'Not applicable to items in this cart',
  [CouponIneligibleReason.MIN_ORDER_VALUE]: 'Add more to use this coupon',
  [CouponIneligibleReason.MIN_PRODUCTS]: 'Add more items to use this coupon',
  [CouponIneligibleReason.ZERO_BENEFIT]: 'No saving on this cart',
};

/**
 * Plain-English reason shown under the three display lines for a coupon the
 * buyer cannot use yet. Returns an empty string when the coupon is eligible,
 * so the picker renders no reason line in that case.
 */
export function formatCouponIneligibleReason(reason: CartCouponItem['ineligible_reason']): string {
  return reason == null ? '' : INELIGIBLE_REASON_MESSAGE[reason];
}
