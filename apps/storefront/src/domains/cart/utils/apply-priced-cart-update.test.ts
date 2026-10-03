import { describe, expect, it } from 'vitest';
import { applyPricedCartUpdate } from './apply-priced-cart-update';
import type { CartShopGroup, GetCartResponse } from '../api/contracts/cart.contract';

function group(id: string, totalMinor: number): CartShopGroup {
  return {
    shop: { id, name: `Shop ${id}` },
    items: [],
    currency: 'USD',
    total_minor: totalMinor,
    discount_minor: 0,
    sale_discount_minor: 0,
    shipping_minor: 0,
  };
}

function response(
  shopGroups: CartShopGroup[],
  totalQuantity: number,
  totalMinor: number,
): GetCartResponse {
  return {
    cart: {
      id: 'cart-1',
      user_id: 'user-1',
      is_temp: false,
      shop_groups: shopGroups,
      recent_items: [],
      total_quantity: totalQuantity,
    },
    summary: {
      currency: 'USD',
      subtotal_minor: totalMinor,
      discount_minor: 0,
      subtotal_after_discount_minor: totalMinor,
      shipping_minor: 0,
      total_minor: totalMinor,
      total_selected_quantity: totalQuantity,
      total_quantity: totalQuantity,
    },
  } as unknown as GetCartResponse;
}

describe('applyPricedCartUpdate', () => {
  it('applies the priced data but keeps the shop order from first load', () => {
    const cached = response([group('shop-a', 1000), group('shop-b', 2000)], 2, 3000);
    // The server orders shops by recent activity, so the edited shop-b moves first.
    const priced = response(
      [{ ...group('shop-b', 9000), discount_minor: 500 }, group('shop-a', 1000)],
      3,
      9500,
    );

    const next = applyPricedCartUpdate(cached, priced);

    expect(next?.cart?.shop_groups.map(entry => entry.shop.id)).toEqual(['shop-a', 'shop-b']);
    // The priced money still replaces the cached money.
    expect(next?.cart?.shop_groups[1]).toMatchObject({ total_minor: 9000, discount_minor: 500 });
    expect(next?.cart?.total_quantity).toBe(3);
    expect(next?.summary.total_minor).toBe(9500);
  });

  it('appends a shop seen for the first time after the cart was loaded', () => {
    const cached = response([group('shop-a', 1000), group('shop-b', 2000)], 2, 3000);
    const priced = response(
      [group('shop-c', 500), group('shop-b', 2000), group('shop-a', 1000)],
      3,
      3500,
    );

    const next = applyPricedCartUpdate(cached, priced);

    expect(next?.cart?.shop_groups.map(entry => entry.shop.id)).toEqual([
      'shop-a', 'shop-b', 'shop-c',
    ]);
  });

  it('is a no-op when the cached cart is absent', () => {
    expect(applyPricedCartUpdate(undefined, response([group('shop-a', 1000)], 1, 1000)))
      .toBeUndefined();
  });

  it('clears the cart when the priced response has an empty cart', () => {
    const cached = response([group('shop-a', 1000)], 1, 1000);
    const empty = { cart: null, summary: cached.summary } as unknown as GetCartResponse;

    expect(applyPricedCartUpdate(cached, empty)?.cart).toBeNull();
  });
});
