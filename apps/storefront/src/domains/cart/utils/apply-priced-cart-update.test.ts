import { describe, expect, it } from 'vitest';
import { applyPricedCartUpdate } from './apply-priced-cart-update';
import type { CartProductItem, CartShopGroup, GetCartResponse } from '../api/contracts/cart.contract';

function group(id: string, totalMinor: number, items: CartProductItem[] = []): CartShopGroup {
  return {
    shop: { id, name: `Shop ${id}` },
    items,
    currency: 'USD',
    total_minor: totalMinor,
    discount_minor: 0,
    sale_discount_minor: 0,
    shipping_minor: 0,
  };
}

function item(id: string, quantity: number): CartProductItem {
  return {
    id,
    quantity,
    is_selected: true,
    unit_price_minor: 1000,
    product: {
      id: `product-${id}`,
      slug: `product-${id}`,
      title: `Product ${id}`,
      shop: { slug: 'shop-a' },
    },
    inventory: {
      id: `inventory-${id}`,
      amount_minor: 1000,
      currency: 'USD',
      stock: 10,
      selected_options: [],
    },
  };
}

function itemIds(groups: CartShopGroup[] | undefined, shopId: string) {
  return groups?.find(entry => entry.shop.id === shopId)?.items.map(entry => entry.id);
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

  it('keeps the item order inside a shop when the server moves the edited item first', () => {
    const cached = response(
      [group('shop-a', 2000, [item('item-1', 1), item('item-2', 1)])],
      2,
      2000,
    );
    // The edited item-2 comes back first because its timestamp moved to now.
    const priced = response(
      [group('shop-a', 6000, [item('item-2', 5), item('item-1', 1)])],
      6,
      6000,
    );

    const next = applyPricedCartUpdate(cached, priced);

    expect(itemIds(next?.cart?.shop_groups, 'shop-a')).toEqual(['item-1', 'item-2']);
    // The priced quantity still replaces the cached one.
    expect(next?.cart?.shop_groups[0]?.items[1]?.quantity).toBe(5);
  });

  it('appends an item added after load to the end of its shop', () => {
    const cached = response([group('shop-a', 1000, [item('item-1', 1)])], 1, 1000);
    const priced = response(
      [group('shop-a', 3000, [item('item-3', 1), item('item-1', 1)])],
      2,
      3000,
    );

    const next = applyPricedCartUpdate(cached, priced);

    expect(itemIds(next?.cart?.shop_groups, 'shop-a')).toEqual(['item-1', 'item-3']);
  });

  it('drops the item that merged into its sibling without reordering the rest', () => {
    const cached = response(
      [group('shop-a', 2000, [item('item-1', 1), item('item-2', 1)])],
      2,
      2000,
    );
    const priced = response(
      [group('shop-a', 6000, [item('item-2', 3)])],
      3,
      6000,
    );

    const next = applyPricedCartUpdate(cached, priced);

    expect(itemIds(next?.cart?.shop_groups, 'shop-a')).toEqual(['item-2']);
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
