import { describe, expect, it } from 'vitest';
import { PromotionProductScope } from '@arc/enums/promotion';
import {
  buildCreatePromoCodePayload,
  createPromoCodeFormSchema,
  promoCodeVisibility,
} from './create-promo-code-form.schema';

describe('create promo code form schema', () => {
  const base = {
    name: 'Holiday promo',
    code: 'HOLIDAY20',
    percent_off: 20,
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
    percent_off: 20,
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
      percent_off: 20,
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
      percent_off: 20,
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
