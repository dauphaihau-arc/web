import type { UseQueryOptions } from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';
import { cartApi } from '~/domains/cart/api/cart.api';
import type { GetCartPromoCodesResponse } from '~/domains/cart/api/contracts/cart.contract';

/**
 * Loads the promo codes a buyer can apply to one shop's cart. The endpoint
 * returns minimal display items already filtered for public visibility, so this
 * query only decides when to ask and never filters client side.
 */
export function useGetCartPromoCodes(
  params: {
    shop_id: MaybeRefOrGetter<string>
    cart_id?: MaybeRefOrGetter<string | undefined>
    enabled?: MaybeRefOrGetter<boolean>
  },
  queryOptions?: Partial<UseQueryOptions<GetCartPromoCodesResponse>>,
) {
  const shopId = computed(() => toValue(params.shop_id));
  const cartId = computed(() => toValue(params.cart_id));
  const enabled = computed(() => (toValue(params.enabled) ?? true) && !!shopId.value);

  return useQuery<GetCartPromoCodesResponse>({
    ...queryOptions,
    enabled,
    queryKey: computed(() => ['get-cart-promo-codes', cartId.value ?? 'my-cart', shopId.value]),
    queryFn: () => cartApi.getPromoCodes({ cart_id: cartId.value, shop_id: shopId.value }),
    retry: 1,
  });
}
