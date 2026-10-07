import type { UpdateCartRequest } from '../api/contracts/cart.contract';
import type { AdditionInfoShopCarts } from '../stores/cart.store';

/**
 * Serializes the cart page's per-shop promo code selection into the API's
 * adjustment payload. Promo codes live in the client store and are re-sent with
 * every pricing mutation, so only shops that actually hold codes are included;
 * shops without codes keep the server's own pricing.
 */
export function buildCartAdjustments(
  shopCarts: Map<AdditionInfoShopCarts['key'], AdditionInfoShopCarts['value']>,
): NonNullable<UpdateCartRequest['addition_info_shop_carts']> {
  return Array.from(shopCarts)
    .map(([shopId, value]) => ({
      shop_id: shopId,
      promo_codes: value?.promoCodes ?? [],
    }))
    .filter(item => item.promo_codes.length > 0);
}
