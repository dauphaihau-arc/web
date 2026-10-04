import { describe, expect, it } from 'vitest';
import {
  CouponAppliesTo,
  CouponIneligibleReason,
  CouponMinOrderTypes,
  CouponTypes,
} from '@arc/enums/coupon';
import {
  formatCouponDiscount,
  formatCouponExpiration,
  formatCouponIneligibleReason,
  formatCouponMinimum,
} from './coupon-display';
import type { CartCouponItem } from '~/domains/cart/api/contracts/cart.contract';

function buildCoupon(overrides: Partial<CartCouponItem>): CartCouponItem {
  return {
    code: 'SAVE10',
    type: CouponTypes.PERCENTAGE,
    applies_to: CouponAppliesTo.ALL,
    amount_off: null,
    percent_off: 10,
    min_order_type: CouponMinOrderTypes.NONE,
    min_order_value: null,
    min_products: null,
    end_date: '2026-12-31T00:00:00.000Z',
    currency: 'USD',
    is_eligible: true,
    ineligible_reason: null,
    ...overrides,
  };
}

describe('coupon money boundaries', () => {
  it('formats a fixed amount in a zero-decimal currency without rescaling major units or inventing decimals', () => {
    expect(formatCouponDiscount(buildCoupon({
      type: CouponTypes.FIXED_AMOUNT,
      percent_off: null,
      amount_off: 50000,
      currency: 'VND',
    }))).toBe('₫50,000 off');
  });

  it('formats a fixed amount in a two-decimal currency as major units, not minor units', () => {
    expect(formatCouponDiscount(buildCoupon({
      type: CouponTypes.FIXED_AMOUNT,
      percent_off: null,
      amount_off: 5,
    }))).toBe('$5.00 off');
  });

  it('reports a minimum spend in the coupon currency and a minimum quantity as a count', () => {
    expect(formatCouponMinimum(buildCoupon({
      min_order_type: CouponMinOrderTypes.ORDER_TOTAL,
      min_order_value: 20,
    }))).toBe('Minimum spend $20.00');

    expect(formatCouponMinimum(buildCoupon({
      min_order_type: CouponMinOrderTypes.NUMBER_OF_PRODUCTS,
      min_products: 3,
    }))).toBe('Minimum quantity 3');
  });
});

describe('coupon expiration boundaries', () => {
  it('renders no expiration line for an invalid end date instead of a bogus date', () => {
    expect(formatCouponExpiration(buildCoupon({ end_date: 'not-a-date' }))).toBe('');
  });
});

describe('coupon ineligible reason messages', () => {
  it('renders no reason line for an eligible coupon', () => {
    expect(formatCouponIneligibleReason(null)).toBe('');
  });

  it('maps each server reason to its plain-English message', () => {
    const cases: Array<[CouponIneligibleReason, string]> = [
      [CouponIneligibleReason.EXPIRED, 'Expired'],
      [CouponIneligibleReason.NOT_STARTED, 'Not started yet'],
      [CouponIneligibleReason.INACTIVE, 'Unavailable'],
      [CouponIneligibleReason.USAGE_LIMIT_REACHED, 'Fully redeemed'],
      [CouponIneligibleReason.USER_USAGE_LIMIT_REACHED, 'You have used this coupon'],
      [CouponIneligibleReason.AUTHENTICATION_REQUIRED, 'Sign in to use this coupon'],
      [CouponIneligibleReason.PRODUCT_SCOPE, 'Not applicable to items in this cart'],
      [CouponIneligibleReason.MIN_ORDER_VALUE, 'Add more to use this coupon'],
      [CouponIneligibleReason.MIN_PRODUCTS, 'Add more items to use this coupon'],
    ];

    expect(cases.map(([reason]) => formatCouponIneligibleReason(reason)))
      .toEqual(cases.map(([, message]) => message));
  });

  it('keeps the minimum-spend reason free of duplicated money formatting', () => {
    expect(formatCouponIneligibleReason(CouponIneligibleReason.MIN_ORDER_VALUE)).not.toMatch(/[$₫€£]|\d/);
  });
});
