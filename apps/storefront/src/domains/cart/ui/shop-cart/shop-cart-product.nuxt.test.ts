import { mountSuspended } from '@nuxt/test-utils/runtime';
import {
  describe, expect, it, vi,
} from 'vitest';
import type { CartProductItem } from '~/domains/cart/api/cart.shared';
import ShopCartProduct from './shop-cart-product.vue';

vi.mock(
  '~/domains/cart/ui/shop-cart/shop-cart-product-options/shop-cart-product-options.vue',
  () => ({
    default: { render: () => null },
  }),
);

type CartShipping = NonNullable<CartProductItem['shipping']>;

function buildItem(shipping?: CartShipping): CartProductItem {
  return {
    id: 'item-1',
    quantity: 1,
    is_selected: true,
    unit_price_minor: 2500,
    product: {
      id: 'product-1',
      slug: 'hand-thrown-mug',
      title: 'Hand-thrown mug',
      shop: { slug: 'clay-house' },
    },
    inventory: {
      id: 'inventory-1',
      amount_minor: 2500,
      currency: 'USD',
      stock: 5,
      selected_options: [],
    },
    ...(shipping ? { shipping } : {}),
  };
}

async function render(shipping?: CartShipping) {
  return mountSuspended(ShopCartProduct, {
    props: { productCart: buildItem(shipping) },
  });
}

describe('shop cart product shipping recovery', () => {
  it('offers a change region action for an unsupported destination', async () => {
    const wrapper = await render({
      available: false,
      is_digital: false,
      reason: 'unsupported_destination',
    });

    expect(
      wrapper.find('[data-testid="cart-item-shipping-action"]').text(),
    ).toContain('Change region');
  });

  it('does not offer a currency recovery action when the line cannot be converted', async () => {
    const wrapper = await render({
      available: false,
      is_digital: false,
      reason: 'unsupported_currency',
    });

    expect(wrapper.find('[data-testid="cart-item-shipping-action"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Shipping isn\'t available in your selected currency');
  });

  it('points an internal failure at the product page seller chat', async () => {
    const wrapper = await render({
      available: false,
      is_digital: false,
      reason: 'profile_not_found',
    });

    const action = wrapper.find('[data-testid="cart-item-shipping-action"]');

    expect(action.text()).toBe('Contact seller');
    expect(action.attributes('href')).toContain('/clay-house/hand-thrown-mug');
    expect(action.attributes('href')).toContain('open_chat=1');
    expect(wrapper.text()).not.toContain('profile_not_found');
  });

  it('keeps the existing warning copy without a recovery action when shipping is available', async () => {
    const wrapper = await render({
      available: true,
      is_digital: false,
    });

    expect(wrapper.find('[data-testid="cart-item-shipping-warning"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="cart-item-shipping-action"]').exists()).toBe(false);
  });
});
