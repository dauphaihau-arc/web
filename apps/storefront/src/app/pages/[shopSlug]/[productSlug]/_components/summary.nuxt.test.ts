import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import type { GetDetailProductBySlugResponse } from '~/domains/product/api/contracts/product.contract';
import Summary from './summary.vue';

function buildProduct(
  reason: 'unsupported_destination'
    | 'unsupported_currency'
    | 'missing_assignment' = 'unsupported_destination',
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
      preview: {
        available: false,
        is_digital: false,
        reason,
      },
    },
  };
}

describe('product summary shipping warning', () => {
  it('warns but keeps the add-to-cart path available when the preview is unsupported', async () => {
    const wrapper = await mountSuspended(Summary, {
      props: { product: buildProduct() },
    });

    expect(wrapper.text()).toContain(
      'Doesn\'t ship to your region. You can still add it to the cart',
    );
  });

  it('does not blame the address when the shipping estimate cannot be converted', async () => {
    const wrapper = await mountSuspended(Summary, {
      props: { product: buildProduct('unsupported_currency') },
    });

    expect(wrapper.text()).toContain('Shipping isn\'t available in your selected currency');
    expect(wrapper.text()).not.toContain('checkout needs an address');
  });

  it('uses the generic copy for internal seller reasons', async () => {
    const wrapper = await mountSuspended(Summary, {
      props: { product: buildProduct('missing_assignment') },
    });

    expect(wrapper.text()).toContain('Shipping options are unavailable for this item');
    expect(wrapper.text()).not.toContain('Shipping is not configured');
  });
});
