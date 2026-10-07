import type { CartProductItem, CartShopGroup, GetCartResponse } from '../api/contracts/cart.contract';

/**
 * The cart mutation endpoints return the whole priced cart, so it is
 * authoritative for every shop group, the cart's total quantity, and the
 * summary. Replacing the cached cart in one step keeps each shop's merchandise
 * total, Code savings, Sale saving, the heading, and the Summary Order in step.
 *
 * The shop order and the item order inside each shop are frozen at first load:
 * the server orders both by most-recent activity, so an update (which bumps the
 * edited row's timestamp) would otherwise move that shop, or that item, to the
 * top. Existing rows keep their cached position, and a row seen for the first
 * time after mount is appended.
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
    .map((cachedGroup) => {
      const pricedGroup = pricedShopById.get(cachedGroup.shop.id);

      if (!pricedGroup) {
        return undefined;
      }

      return {
        ...pricedGroup,
        items: orderItemsByCachedOrder(cachedGroup.items, pricedGroup.items),
      };
    })
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

function orderItemsByCachedOrder(
  cachedItems: CartProductItem[],
  pricedItems: CartProductItem[],
): CartProductItem[] {
  const pricedItemById = new Map(pricedItems.map(item => [item.id, item]));

  const orderedItems = cachedItems
    .map(item => pricedItemById.get(item.id))
    .filter((item): item is CartProductItem => item !== undefined);

  const placedItemIds = new Set(orderedItems.map(item => item.id));

  for (const item of pricedItems) {
    if (!placedItemIds.has(item.id)) {
      orderedItems.push(item);
    }
  }

  return orderedItems;
}
