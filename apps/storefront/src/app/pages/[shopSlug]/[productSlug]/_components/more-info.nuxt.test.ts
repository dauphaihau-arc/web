import { flushPromises } from '@vue/test-utils';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { ref } from 'vue';
import {
  describe, expect, it, vi,
} from 'vitest';
import type {
  GetDetailProductBySlugResponse,
} from '~/domains/product/api/contracts/product.contract';
import MoreInfo from './more-info.vue';

type ProductShipping = NonNullable<GetDetailProductBySlugResponse['shipping']>;
type ProductShippingDestinations = ProductShipping['destinations'];
type ProductShippingPreview = NonNullable<ProductShipping['preview']>;

mockNuxtImport('useRoute', () => () => ({
  path: '/clay-house/hand-thrown-mug',
  query: {},
}));

// Vitest hoists this factory above the imports; `ref` is only dereferenced
// when a mount calls the hook, after module evaluation.
vi.mock('~/domains/location/queries/countries.query', () => ({
  useGetCountries: () => ({
    data: ref([
      {
        code: 'US',
        name: 'United States',
        has_administrative_areas: true,
        postal_code_required: true,
      },
      {
        code: 'CA',
        name: 'Canada',
        has_administrative_areas: true,
        postal_code_required: true,
      },
    ]),
  }),
}));

vi.mock('~/domains/me/queries/current-user.query', () => ({
  useGetCurrentUser: () => ({
    data: ref({ user: null }),
  }),
}));

vi.mock('~/domains/me/mutations/chat/create-conversation.mutation', () => ({
  useCreateOrGetMyChatConversation: () => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  }),
}));

vi.mock('~/domains/auth/ui/login-register/register-login-dialog.vue', () => ({
  default: { render: () => null },
}));

vi.mock('~/domains/me/ui/chat/chat-conversation-panel.vue', () => ({
  default: { render: () => null },
}));

function buildProduct(
  destinations: ProductShippingDestinations,
  preview?: ProductShippingPreview,
): GetDetailProductBySlugResponse {
  return {
    id: 'product-1',
    shop: {
      id: 'shop-1',
      shop_name: 'Clay House',
      slug: 'clay-house',
    },
    title: 'Hand-thrown mug',
    slug: 'hand-thrown-mug',
    description: 'A mug thrown by hand.',
    who_made: 'i_did',
    is_digital: false,
    options: [],
    stock_notice_threshold: 1,
    review_summary: { average: 0, count: 0 },
    images: [],
    variants: [],
    inventory: [],
    shipping: { destinations, ...(preview ? { preview } : {}) },
  };
}

async function renderMoreInfo(
  destinations: ProductShippingDestinations,
  preview?: ProductShippingPreview,
) {
  const wrapper = await mountSuspended(MoreInfo, {
    props: { product: buildProduct(destinations, preview) },
  });

  await flushPromises();

  return wrapper;
}

describe('more info shipping coverage', () => {
  it('resolves destination country codes through the Arc countries response', async () => {
    const wrapper = await renderMoreInfo([
      { destination_scope: 'country', destination_country: 'US' },
    ]);

    expect(wrapper.text()).toContain('Ships to United States');
  });

  it('falls back to the destination code when the Arc response has no match', async () => {
    const wrapper = await renderMoreInfo([
      { destination_scope: 'country', destination_country: 'ZZ' },
    ]);

    expect(wrapper.text()).toContain('Ships to ZZ');
  });

  it('shows the delivery window, converted fee, and dispatch country', async () => {
    const wrapper = await renderMoreInfo([], {
      available: true,
      is_digital: false,
      one_item_fee_minor: 500,
      currency: 'USD',
      ship_from_country: 'US',
      estimate: { min_days: 4, max_days: 8 },
    });

    expect(wrapper.text()).toContain('Order today to get by');
    expect(wrapper.text()).toContain('Cost to ship: $5.00');
    expect(wrapper.text()).toContain('Ships from: United States');
  });

  it('shows the unsupported destination reason and dispatch country', async () => {
    const wrapper = await renderMoreInfo(
      [{ destination_scope: 'country', destination_country: 'US' }],
      {
        available: false,
        is_digital: false,
        reason: 'unsupported_destination',
        ship_from_country: 'US',
      },
    );

    expect(wrapper.text()).toContain('Doesn\'t ship to your region');
    expect(wrapper.text()).toContain('Ships from: United States');
  });

  it('shows the destination reason without a recovery action', async () => {
    const wrapper = await renderMoreInfo([], {
      available: false,
      is_digital: false,
      reason: 'unsupported_destination',
    });

    expect(wrapper.find('[data-testid="product-shipping-recovery"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Doesn\'t ship to your region');
  });

  it('does not offer a currency recovery action when conversion fails', async () => {
    const wrapper = await renderMoreInfo([], {
      available: false,
      is_digital: false,
      reason: 'unsupported_currency',
    });

    expect(wrapper.find('[data-testid="product-shipping-recovery"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Shipping isn\'t available in your selected currency');
  });

  it('leaves internal shipping failures to the seller section', async () => {
    const wrapper = await renderMoreInfo([], {
      available: false,
      is_digital: false,
      reason: 'profile_not_ready',
    });

    expect(wrapper.find('[data-testid="product-shipping-recovery"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('profile_not_ready');
  });

  it('shows digital delivery instead of a physical shipping preview', async () => {
    const wrapper = await renderMoreInfo([], {
      available: true,
      is_digital: true,
    });

    expect(wrapper.text()).toContain('Digital delivery');
    expect(wrapper.text()).not.toContain('Shipping coverage not available');
  });

  it('shows the unsupported currency reason without fabricating a fee', async () => {
    const wrapper = await renderMoreInfo([], {
      available: false,
      is_digital: false,
      reason: 'unsupported_currency',
    });

    expect(wrapper.text()).toContain('Shipping isn\'t available in your selected currency');
    expect(wrapper.text()).not.toContain('Cost to ship');
  });

  it('does not explain seller configuration to the buyer', async () => {
    const wrapper = await renderMoreInfo([], {
      available: false,
      is_digital: false,
      reason: 'missing_assignment',
    });

    expect(wrapper.text()).toContain('Shipping options are unavailable for this item');
    expect(wrapper.text()).not.toContain('Shipping is not configured');
  });

  it('updates the fee when the Market preview changes', async () => {
    const wrapper = await renderMoreInfo([], {
      available: true,
      is_digital: false,
      one_item_fee_minor: 500,
      currency: 'USD',
      ship_from_country: 'US',
      estimate: { min_days: 4, max_days: 8 },
    });

    expect(wrapper.text()).toContain('Cost to ship: $5.00');

    await wrapper.setProps({
      product: buildProduct([], {
        available: true,
        is_digital: false,
        one_item_fee_minor: 700,
        currency: 'USD',
        ship_from_country: 'US',
        estimate: { min_days: 6, max_days: 12 },
      }),
    });
    await flushPromises();

    expect(wrapper.text()).toContain('Cost to ship: $7.00');
  });
});
