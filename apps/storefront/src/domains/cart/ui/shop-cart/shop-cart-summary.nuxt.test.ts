import { formatMinorCurrency } from '@arc/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { CartProductItem, CartShopGroup } from '~/domains/cart/api/cart.shared';
import ShopCartSummary from './shop-cart-summary.vue';

const SHOP_ID = '00000000-0000-4000-8000-000000000001';

function buildItem(overrides?: Partial<CartProductItem>): CartProductItem {
  return {
    id: 'item-1',
    quantity: 1,
    is_selected: true,
    unit_price_minor: 2500,
    product: {
      id: 'product-1',
      title: 'Mug',
      slug: 'mug',
      shop: { slug: 'ceramics-studio' },
    },
    inventory: {
      id: 'inventory-1',
      amount_minor: 2500,
      currency: 'USD',
      stock: 10,
      selected_options: [],
    },
    ...overrides,
  };
}

function buildShopCart(overrides?: Partial<CartShopGroup>): CartShopGroup {
  return {
    shop: { id: SHOP_ID, name: 'Ceramics Studio' },
    items: [buildItem()],
    currency: 'USD',
    total_minor: 2500,
    discount_minor: 0,
    sale_discount_minor: 0,
    shipping_minor: 0,
    ...overrides,
  };
}

function render(shopCart = buildShopCart()) {
  return mount(ShopCartSummary, { props: { shopCart } });
}

describe('shop cart summary', () => {
  it('hides the total when one selected line at quantity 1 already prints it', () => {
    const text = render().text();

    expect(text).not.toContain('Total');
    expect(text).not.toContain(formatMinorCurrency(2500, 'USD'));
  });

  it('shows the total once a line carries a quantity above 1', () => {
    const text = render(buildShopCart({
      items: [buildItem({ quantity: 2 })],
      total_minor: 5000,
    })).text();

    expect(text).toContain('Total');
    expect(text).toContain(formatMinorCurrency(5000, 'USD'));
  });

  it('shows the total once a shop carries a second selected line', () => {
    const text = render(buildShopCart({
      items: [
        buildItem(),
        buildItem({
          id: 'item-2',
          inventory: {
            id: 'inventory-2',
            amount_minor: 2500,
            currency: 'USD',
            stock: 10,
            selected_options: [],
          },
        }),
      ],
      total_minor: 5000,
    })).text();

    expect(text).toContain('Total');
    expect(text).toContain(formatMinorCurrency(5000, 'USD'));
  });

  it('states nothing when every line is unchecked', () => {
    const text = render(buildShopCart({
      items: [buildItem({ is_selected: false })],
      total_minor: 0,
    })).text();

    expect(text).not.toContain('Total');
    expect(text).not.toContain(formatMinorCurrency(0, 'USD'));
    expect(text).not.toContain(formatMinorCurrency(2500, 'USD'));
  });

  it('shows the applied code saving and subtracts it from the total exactly once', () => {
    const text = render(buildShopCart({ discount_minor: 1250 })).text();

    expect(text).toContain('Product(s) total');
    expect(text).toContain('Code savings');
    expect(text).toContain('Total');
    // Merchandise - saving = total, so the saving amount is printed twice: the
    // savings row and the resulting total, never subtracted twice.
    expect(text.split(formatMinorCurrency(1250, 'USD')).length - 1).toBe(2);
    expect(text.split(formatMinorCurrency(2500, 'USD')).length - 1).toBe(1);
  });

  it('formats every amount in the shop currency', () => {
    const text = render(buildShopCart({ currency: 'VND', discount_minor: 500 })).text();

    expect(text).toContain(formatMinorCurrency(2500, 'VND'));
    expect(text).not.toContain(formatMinorCurrency(2500, 'USD'));
  });

  it('never exposes internal shop identifiers', () => {
    const text = render(buildShopCart({ discount_minor: 1250 })).text();

    expect(text).not.toContain(SHOP_ID);
  });
});
