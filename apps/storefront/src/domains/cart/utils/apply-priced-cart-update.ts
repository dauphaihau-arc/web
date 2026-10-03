import type { CartShopGroup, GetCartResponse } from '../api/contracts/cart.contract';

/**
 * The cart mutation endpoints return the whole priced cart, so it is
 * authoritative for every shop group, the cart's total quantity, and the
 * summary. Replacing the cached cart in one step keeps each shop's merchandise
 * total, Code savings, Sale saving, the heading, and the Summary Order in step.
 *
 * The shop order, however, is frozen at first load: the server orders shops by
 * most-recent activity, so an update (which bumps the edited item's timestamp)
 * would otherwise move that shop to the top. Existing shops keep their cached
 * position, and a shop seen for the first time after mount is appended.
 */
export function applyPricedCartUpdate(
  oldData: GetCartResponse | undefined,
  data: GetCartResponse,
): GetCartResponse | undefined {
  if (!oldData) {
    return oldData;
  }

  if (!oldData.cart || !data.cart) {
    return {
      ...oldData,
      cart: data.cart,
      summary: data.summary,
    };
  }

  const pricedShopById = new Map(
    data.cart.shop_groups.map(group => [group.shop.id, group]),
  );

  const orderedShopGroups: CartShopGroup[] = oldData.cart.shop_groups
    .map(group => pricedShopById.get(group.shop.id))
    .filter((group): group is CartShopGroup => group !== undefined);

  const placedShopIds = new Set(orderedShopGroups.map(group => group.shop.id));
  for (const group of data.cart.shop_groups) {
    if (!placedShopIds.has(group.shop.id)) {
      orderedShopGroups.push(group);
    }
  }

  return {
    ...oldData,
    cart: {
      ...data.cart,
      shop_groups: orderedShopGroups,
    },
    summary: data.summary,
  };
}
