import {
  describe, expect, it, vi,
} from 'vitest';
import { defineComponent, h } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { useCreateProductForm } from './use-create-product-form/use-create-product-form';

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

vi.mock('./use-create-product-form/use-create-product-form-submit', () => ({
  useCreateProductSubmit: () => ({ loadingSubmit: false, submit: vi.fn() }),
}));
vi.mock('~/domains/auth/queries/client-config.query', () => ({
  useAuthClientConfig: () => ({ data: { value: undefined } }),
}));
vi.mock('~/domains/shop/queries/my-shop.query', () => ({
  useGetMyShop: () => ({ data: { value: { currency: 'USD' } } }),
}));
vi.mock('~/domains/shop/mutations/generate-product-description.mutation', () => ({
  useGenerateProductDescription: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

function profile(overrides: Record<string, unknown>) {
  return {
    id: 'profile-1',
    name: 'Standard',
    status: 'active',
    currency: 'USD',
    checkout_ready: true,
    readiness_issues: [],
    is_default: false,
    ...overrides,
  };
}

/** The id the create form would submit, or '' when nothing is selected. */
async function mountSelectedProfile() {
  const harness = defineComponent({
    setup() {
      const form = useCreateProductForm();

      return () => h('span', { 'data-selected-profile': '' }, form.shippingProfileId.value ?? '');
    },
  });

  const wrapper = await mountSuspended(harness);

  return wrapper.get('[data-selected-profile]').text();
}

describe('create product shipping profile default', () => {
  it('pre-selects the shop default shipping profile', async () => {
    state.profiles = {
      results: [
        profile({ id: 'other' }),
        profile({ id: 'default-profile', is_default: true }),
      ],
    };

    expect(await mountSelectedProfile()).toBe('default-profile');
  });

  it('leaves the picker empty when the shop has no default', async () => {
    state.profiles = { results: [profile({ id: 'other' })] };

    expect(await mountSelectedProfile()).toBe('');
  });

  it('never pre-selects a default that cannot price a checkout', async () => {
    state.profiles = {
      results: [profile({ id: 'degraded', is_default: true, checkout_ready: false })],
    };

    expect(await mountSelectedProfile()).toBe('');
  });
});
