import { describe, expect, it } from 'vitest';
import {
  PromoCodeIneligibleReason,
  PromotionBenefitType,
  PromotionMinOrderType,
  PromotionProductScope,
} from '@arc/enums/promotion';
import {
  formatPromoCodeDiscount,
  formatPromoCodeExpiration,
  formatPromoCodeIneligibleReason,
  formatPromoCodeMinimum,
} from './promo-code-display';
import type { CartPromoCodeItem } from '~/domains/cart/api/contracts/cart.contract';

function buildPromoCode(overrides: Partial<CartPromoCodeItem>): CartPromoCodeItem {
  return {
    code: 'SAVE10',
    benefit_type: PromotionBenefitType.PERCENTAGE,
    product_scope: PromotionProductScope.ALL,
    amount_off: null,
    percent_off: 10,
    min_order_type: PromotionMinOrderType.NONE,
    min_order_value: null,
    min_purchase_quantity: null,
    end_date: '2026-12-31T00:00:00.000Z',
    currency: 'USD',
    is_eligible: true,
    ineligible_reason: null,
    ...overrides,
  };
}

describe('promo code money boundaries', () => {
  it('formats a fixed amount in a zero-decimal currency without rescaling major units or inventing decimals', () => {
    expect(formatPromoCodeDiscount(buildPromoCode({
      benefit_type: PromotionBenefitType.FIXED_AMOUNT,
      percent_off: null,
      amount_off: 50000,
      currency: 'VND',
    }))).toBe('₫50,000 off');
  });

  it('formats a fixed amount in a two-decimal currency as major units, not minor units', () => {
    expect(formatPromoCodeDiscount(buildPromoCode({
      benefit_type: PromotionBenefitType.FIXED_AMOUNT,
      percent_off: null,
      amount_off: 5,
    }))).toBe('$5.00 off');
  });

  it('reports a minimum spend in the promo code currency and a minimum quantity as a count', () => {
    expect(formatPromoCodeMinimum(buildPromoCode({
      min_order_type: PromotionMinOrderType.ORDER_TOTAL,
      min_order_value: 20,
    }))).toBe('Minimum spend $20.00');

    expect(formatPromoCodeMinimum(buildPromoCode({
      min_order_type: PromotionMinOrderType.PURCHASE_QUANTITY,
      min_purchase_quantity: 3,
    }))).toBe('Minimum quantity 3');
  });
});

describe('promo code expiration boundaries', () => {
  it('renders no expiration line for an invalid end date instead of a bogus date', () => {
    expect(formatPromoCodeExpiration(buildPromoCode({ end_date: 'not-a-date' }))).toBe('');
  });
});

describe('promo code ineligible reason messages', () => {
  it('renders no reason line for an eligible promo code', () => {
    expect(formatPromoCodeIneligibleReason(null)).toBe('');
  });

  it('maps each server reason to its plain-English message', () => {
    const cases: Array<[PromoCodeIneligibleReason, string]> = [
      [PromoCodeIneligibleReason.EXPIRED, 'Expired'],
      [PromoCodeIneligibleReason.NOT_STARTED, 'Not started yet'],
      [PromoCodeIneligibleReason.USAGE_LIMIT_REACHED, 'Fully redeemed'],
      [PromoCodeIneligibleReason.USER_USAGE_LIMIT_REACHED, 'You have used this promo code'],
      [PromoCodeIneligibleReason.AUTHENTICATION_REQUIRED, 'Sign in to use this promo code'],
      [PromoCodeIneligibleReason.PRODUCT_SCOPE, 'Not applicable to items in this cart'],
      [PromoCodeIneligibleReason.MIN_ORDER_VALUE, 'Add more to use this promo code'],
      [PromoCodeIneligibleReason.MIN_PRODUCTS, 'Add more items to use this promo code'],
      [PromoCodeIneligibleReason.ZERO_BENEFIT, 'No saving on this cart'],
    ];

    expect(cases.map(([reason]) => formatPromoCodeIneligibleReason(reason)))
      .toEqual(cases.map(([, message]) => message));
  });

  it('keeps the minimum-spend reason free of duplicated money formatting', () => {
    expect(formatPromoCodeIneligibleReason(PromoCodeIneligibleReason.MIN_ORDER_VALUE)).not.toMatch(/[$₫€£]|\d/);
  });
});
