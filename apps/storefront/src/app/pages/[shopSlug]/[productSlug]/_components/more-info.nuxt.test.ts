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

type ProductShippingDestinations = NonNullable<GetDetailProductBySlugResponse['shipping']>['destinations'];

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

function buildProduct(destinations: ProductShippingDestinations): GetDetailProductBySlugResponse {
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
    shipping: { destinations },
  };
}

async function renderMoreInfo(destinations: ProductShippingDestinations) {
  const wrapper = await mountSuspended(MoreInfo, {
    props: { product: buildProduct(destinations) },
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
});
