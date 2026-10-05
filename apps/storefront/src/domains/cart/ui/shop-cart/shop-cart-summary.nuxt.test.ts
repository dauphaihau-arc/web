import { formatMinorCurrency } from '@arc/utils';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { CartShopGroup } from '~/domains/cart/api/cart.shared';
import ShopCartSummary from './shop-cart-summary.vue';

const SHOP_ID = '00000000-0000-4000-8000-000000000001';

function buildShopCart(overrides?: Partial<CartShopGroup>): CartShopGroup {
  return {
    shop: { id: SHOP_ID, name: 'Ceramics Studio' },
    items: [],
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
  it('shows only the total when the merchandise total equals it', () => {
    const text = render().text();

    expect(text).toContain('Total');
    expect(text).not.toContain('Product(s) total');
    expect(text).not.toContain('Code savings');
    expect(text.split(formatMinorCurrency(2500, 'USD')).length - 1).toBe(1);
  });

  it('shows the applied code saving and subtracts it from the total exactly once', () => {
    const text = render(buildShopCart({ discount_minor: 1250 })).text();

    expect(text).toContain('Product(s) total');
    expect(text).toContain('Code savings');
    expect(text).toContain(formatMinorCurrency(2500, 'USD'));
    expect(text).toContain(formatMinorCurrency(1250, 'USD'));
    // Total = 2500 - 1250; the savings are not subtracted twice.
    expect(text.split(formatMinorCurrency(1250, 'USD')).length - 1).toBe(2);
  });

  it('formats every amount in the shop currency', () => {
    const text = render(buildShopCart({ currency: 'VND' })).text();

    expect(text).toContain(formatMinorCurrency(2500, 'VND'));
    expect(text).not.toContain(formatMinorCurrency(2500, 'USD'));
  });

  it('never exposes internal shop identifiers', () => {
    expect(render().text()).not.toContain(SHOP_ID);
  });
});
