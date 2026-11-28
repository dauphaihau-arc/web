import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime';
import {
  describe, expect, it, vi,
} from 'vitest';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';
import AddToCartForm from './add-to-cart-form.vue';

type ProductShippingPreview = NonNullable<
  NonNullable<GetDetailProductBySlugResponse['shipping']>['preview']
>;

vi.mock('~/domains/cart/mutations/add-product.mutation', async () => {
  // vi.mock factories are hoisted above imports, so vue must load dynamically.
  const { ref } = await import('vue');

  return {
    useAddProductToCart: () => ({
      mutateAsync: vi.fn(),
      isPending: ref(false),
    }),
  };
});

mockNuxtImport('useToast', () => () => ({ add: vi.fn() }));
mockNuxtImport('useQueryClient', () => () => ({ setQueryData: vi.fn() }));

function buildProduct(preview?: ProductShippingPreview): GetDetailProductBySlugResponse {
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
    inventory: [{
      id: 'inventory-1',
      product_variant_id: 'variant-1',
      sku: 'MUG-1',
      stock: 5,
      amount_minor: 2500,
      currency: 'USD',
    }],
    shipping: {
      destinations: [],
      ...(preview ? { preview } : {}),
    },
  };
}

async function render(preview: ProductShippingPreview) {
  return mountSuspended(AddToCartForm, {
    props: { product: buildProduct(preview) },
  });
}

describe('add to cart purchase actions', () => {
  it('keeps both purchase actions enabled when the shipping preview failed internally', async () => {
    const wrapper = await render({
      available: false,
      is_digital: false,
      reason: 'missing_assignment',
    });

    expect(wrapper.find('[data-testid="add-to-cart-submit"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[data-testid="buy-now-submit"]').attributes('disabled')).toBeUndefined();
  });

  it('keeps both purchase actions enabled for an unsupported destination', async () => {
    const wrapper = await render({
      available: false,
      is_digital: false,
      reason: 'unsupported_destination',
    });

    expect(wrapper.find('[data-testid="add-to-cart-submit"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[data-testid="buy-now-submit"]').attributes('disabled')).toBeUndefined();
  });

  it('keeps both purchase actions enabled for an unsupported currency', async () => {
    const wrapper = await render({
      available: false,
      is_digital: false,
      reason: 'unsupported_currency',
    });

    expect(wrapper.find('[data-testid="add-to-cart-submit"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[data-testid="buy-now-submit"]').attributes('disabled')).toBeUndefined();
  });
});
