import {
  describe, expect, it, vi,
} from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { ShippingProfileResource } from '~/domains/shop/api/shipping-profile/contracts/shipping-profile.contract';
import ProductShippingProfileSection from './product-shipping-profile-section.vue';

const state = vi.hoisted(() => ({
  profiles: undefined as unknown,
}));

vi.mock('~/domains/shop/queries/shipping-profiles.query', async () => {
  // `vi.mock` factories are hoisted above the module's own imports, so `vue`
  // cannot be a static import here.
  const { computed } = await import('vue');

  return {
    SHIPPING_PROFILE_PICKER_QUERY: { page: 1, limit: 100 },
    useShopShippingProfiles: () => ({
      data: computed(() => state.profiles),
      isPending: computed(() => false),
    }),
  };
});

function profile(overrides: Partial<ShippingProfileResource>): ShippingProfileResource {
  return {
    id: 'profile-1',
    shop_id: 'shop-1',
    name: 'Standard',
    status: 'active',
    version: 1,
    currency: 'USD',
    checkout_ready: true,
    readiness_issues: [],
    is_default: false,
    assigned_product_count: 0,
    published_product_count: 0,
    rates: [],
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as ShippingProfileResource;
}

function render(selectedId: string) {
  return mountSuspended(ProductShippingProfileSection, {
    props: { modelValue: selectedId },
  });
}

describe('product shipping profile section', () => {
  it('marks the selected profile as the shop default', async () => {
    state.profiles = {
      results: [profile({ id: 'default-profile', is_default: true })],
    };

    const wrapper = await render('default-profile');

    expect(wrapper.text()).toContain('Default');
  });

  it('leaves a profile that is not the default unmarked', async () => {
    state.profiles = { results: [profile({ id: 'plain' })] };

    const wrapper = await render('plain');

    expect(wrapper.text()).not.toContain('Default');
  });
});
