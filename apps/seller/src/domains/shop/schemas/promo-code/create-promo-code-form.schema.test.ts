import { describe, expect, it } from 'vitest';
import {
  PromotionBenefitType,
  PromotionMinOrderType,
  PromotionProductScope,
} from '@arc/enums/promotion';
import {
  buildCreatePromoCodePayload,
  createPromoCodeFormSchema,
  promoCodeVisibility,
} from './create-promo-code-form.schema';

describe('create promo code form schema', () => {
  const base = {
    name: 'Holiday promo',
    code: 'HOLIDAY20',
    benefit_type: PromotionBenefitType.PERCENTAGE,
    percent_off: 20,
    amount_off: 5,
    min_order_type: PromotionMinOrderType.NONE,
    min_order_value: 50,
    min_purchase_quantity: 2,
    visibility: promoCodeVisibility.PUBLIC,
    product_scope: PromotionProductScope.ALL,
    product_ids: [],
    timezone: 'America/New_York',
    start_mode: 'now' as const,
    start_local: '',
    end_local: '2026-12-31T23:59',
    start_occurrence: undefined,
    end_occurrence: undefined,
  };

  it('accepts a valid start-now promo code', () => {
    const result = createPromoCodeFormSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('accepts a fixed-amount promo code with a minimum spend', () => {
    const result = createPromoCodeFormSchema.safeParse({
      ...base,
      benefit_type: PromotionBenefitType.FIXED_AMOUNT,
      amount_off: 12.5,
      min_order_type: PromotionMinOrderType.ORDER_TOTAL,
      min_order_value: 100,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a shop-wide free-shipping promo code with a minimum spend', () => {
    const result = createPromoCodeFormSchema.safeParse({
      ...base,
      benefit_type: PromotionBenefitType.FREE_SHIPPING,
      product_scope: PromotionProductScope.ALL,
      min_order_type: PromotionMinOrderType.ORDER_TOTAL,
      min_order_value: 100,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a fixed amount that is not positive', () => {
    const result = createPromoCodeFormSchema.safeParse({
      ...base,
      benefit_type: PromotionBenefitType.FIXED_AMOUNT,
      amount_off: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path)).toContainEqual(['amount_off']);
    }
  });

  it('rejects a minimum spend that is not positive', () => {
    const result = createPromoCodeFormSchema.safeParse({
      ...base,
      min_order_type: PromotionMinOrderType.ORDER_TOTAL,
      min_order_value: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path)).toContainEqual(['min_order_value']);
    }
  });

  it('rejects a minimum quantity below one', () => {
    const result = createPromoCodeFormSchema.safeParse({
      ...base,
      min_order_type: PromotionMinOrderType.PURCHASE_QUANTITY,
      min_purchase_quantity: 0,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path)).toContainEqual(['min_purchase_quantity']);
    }
  });

  it('rejects a scheduled start without a local time', () => {
    const result = createPromoCodeFormSchema.safeParse({
      ...base,
      start_mode: 'scheduled' as const,
      start_local: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a specific product scope without products', () => {
    const result = createPromoCodeFormSchema.safeParse({
      ...base,
      product_scope: PromotionProductScope.SPECIFIC,
      product_ids: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path)).toContainEqual(['product_ids']);
    }
  });

  it('rejects an end that is not after the start', () => {
    const result = createPromoCodeFormSchema.safeParse({
      ...base,
      start_mode: 'scheduled' as const,
      start_local: '2026-12-31T23:59',
      end_local: '2026-12-31T23:59',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path)).toContainEqual(['end_local']);
    }
  });
});

describe('buildCreatePromoCodePayload', () => {
  const base = {
    name: '  Holiday promo  ',
    code: '  holiday20  ',
    benefit_type: PromotionBenefitType.PERCENTAGE,
    percent_off: 20,
    amount_off: 5,
    min_order_type: PromotionMinOrderType.NONE,
    min_order_value: 50,
    min_purchase_quantity: 2,
    visibility: promoCodeVisibility.PUBLIC,
    product_scope: PromotionProductScope.ALL,
    product_ids: [] as string[],
    timezone: 'America/New_York',
    start_mode: 'now' as const,
    start_local: '',
    end_local: '2026-12-31T23:59',
    start_occurrence: undefined as 'earlier' | 'later' | undefined,
    end_occurrence: undefined as 'earlier' | 'later' | undefined,
  };

  it('builds the exact pinned request body for a start-now, all-products promo code', () => {
    const payload = buildCreatePromoCodePayload(base);

    expect(payload).toEqual({
      name: 'Holiday promo',
      code: 'HOLIDAY20',
      benefit_type: 'percentage',
      percent_off: 20,
      min_order_type: 'none',
      visibility: 'public',
      product_scope: 'all',
      timezone: 'America/New_York',
      start_now: true,
      end_local: '2026-12-31T23:59',
      end_offset_minutes: -300,
    });
  });

  it('builds a fixed-amount benefit with a minimum quantity', () => {
    const payload = buildCreatePromoCodePayload({
      ...base,
      benefit_type: PromotionBenefitType.FIXED_AMOUNT,
      amount_off: 12.5,
      min_order_type: PromotionMinOrderType.PURCHASE_QUANTITY,
      min_purchase_quantity: 3,
    });

    expect(payload).toEqual({
      name: 'Holiday promo',
      code: 'HOLIDAY20',
      benefit_type: 'fixed_amount',
      amount_off: 12.5,
      min_order_type: 'purchase_quantity',
      min_purchase_quantity: 3,
      visibility: 'public',
      product_scope: 'all',
      timezone: 'America/New_York',
      start_now: true,
      end_local: '2026-12-31T23:59',
      end_offset_minutes: -300,
    });
  });

  it('builds a shop-wide free-shipping benefit without a benefit value', () => {
    const payload = buildCreatePromoCodePayload({
      ...base,
      benefit_type: PromotionBenefitType.FREE_SHIPPING,
      // Even a retained Product Scope cannot make free shipping targeted.
      product_scope: PromotionProductScope.SPECIFIC,
      product_ids: ['product-1'],
      min_order_type: PromotionMinOrderType.ORDER_TOTAL,
      min_order_value: 100,
    });

    expect(payload).toEqual({
      name: 'Holiday promo',
      code: 'HOLIDAY20',
      benefit_type: 'free_shipping',
      min_order_type: 'order_total',
      min_order_value: 100,
      visibility: 'public',
      product_scope: 'all',
      timezone: 'America/New_York',
      start_now: true,
      end_local: '2026-12-31T23:59',
      end_offset_minutes: -300,
    });
  });

  it('builds the exact pinned request body for a scheduled, specific-products promo code', () => {
    const payload = buildCreatePromoCodePayload({
      ...base,
      start_mode: 'scheduled',
      start_local: '2026-12-25T09:00',
      product_scope: PromotionProductScope.SPECIFIC,
      product_ids: ['product-1', 'product-2'],
      visibility: promoCodeVisibility.CODE_ONLY,
    });

    expect(payload).toEqual({
      name: 'Holiday promo',
      code: 'HOLIDAY20',
      benefit_type: 'percentage',
      percent_off: 20,
      min_order_type: 'none',
      visibility: 'code_only',
      product_scope: 'specific',
      product_ids: ['product-1', 'product-2'],
      timezone: 'America/New_York',
      start_local: '2026-12-25T09:00',
      start_offset_minutes: -300,
      end_local: '2026-12-31T23:59',
      end_offset_minutes: -300,
    });
  });
});
