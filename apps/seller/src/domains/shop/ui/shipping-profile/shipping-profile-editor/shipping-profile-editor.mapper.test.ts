import {
  describe, expect, it,
} from 'vitest';
import { ShippingDestinationScopes, ShippingProfileStatuses } from '@arc/enums/shipping';
import {
  createEmptyShippingProfileRate,
  toShippingProfileFormState,
} from './shipping-profile-editor.mapper';
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';

function profile(
  overrides: Partial<ShippingProfileResource> = {},
): ShippingProfileResource {
  return {
    id: 'profile-1',
    shop_id: 'shop-1',
    name: 'Standard shipping',
    status: ShippingProfileStatuses.ACTIVE,
    version: 1,
    currency: 'USD',
    checkout_ready: true,
    readiness_issues: [],
    is_default: false,
    assigned_product_count: 0,
    published_product_count: 0,
    rates: [],
    created_at: '2026-09-24T00:00:00.000Z',
    updated_at: '2026-09-24T00:00:00.000Z',
    ...overrides,
  } as ShippingProfileResource;
}

describe('shipping profile editor mapper', () => {
  it('starts a new rate with no day range, so a typed minimum has no zero to contradict', () => {
    const rate = createEmptyShippingProfileRate();

    expect(rate.delivery_time_min_days).toBeUndefined();
    expect(rate.delivery_time_max_days).toBeUndefined();
  });

  it('starts a new profile with no Processing range', () => {
    const state = toShippingProfileFormState(undefined, 'USD');

    expect(state.processing_time_min_days).toBeUndefined();
    expect(state.processing_time_max_days).toBeUndefined();
    expect(state.rates).toHaveLength(1);
  });

  it('keeps absent ranges absent when editing a profile that has none', () => {
    const state = toShippingProfileFormState(profile({
      rates: [{
        id: 'rate-1',
        position: 1,
        destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
        one_item_fee_minor: 599,
        additional_item_fee_minor: 199,
      }],
    } as Partial<ShippingProfileResource>), 'USD');

    expect(state.processing_time_min_days).toBeUndefined();
    expect(state.processing_time_max_days).toBeUndefined();
    expect(state.rates[0]?.delivery_time_min_days).toBeUndefined();
    expect(state.rates[0]?.delivery_time_max_days).toBeUndefined();
  });

  it('reads a configured range back as whole days', () => {
    const state = toShippingProfileFormState(profile({
      processing_time_min_days: 1,
      processing_time_max_days: 3,
      rates: [{
        id: 'rate-1',
        position: 1,
        destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
        one_item_fee_minor: 599,
        additional_item_fee_minor: 199,
        delivery_time_min_days: 3,
        delivery_time_max_days: 5,
      }],
    } as Partial<ShippingProfileResource>), 'USD');

    expect(state.processing_time_min_days).toBe(1);
    expect(state.processing_time_max_days).toBe(3);
    expect(state.rates[0]?.delivery_time_min_days).toBe(3);
    expect(state.rates[0]?.delivery_time_max_days).toBe(5);
  });
});
