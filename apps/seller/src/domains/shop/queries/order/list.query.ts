import { resolveMyShopId } from '../../utils/resolve-my-shop-id';
import { shopOrderApi } from '~/domains/shop/api/order/order.api';
import type { ListShopOrdersRequest } from '~/domains/shop/api/order/contracts/order.contract';

export function useShopGetOrders(query?: MaybeRefOrGetter<ListShopOrdersRequest>) {
  const queryClient = useQueryClient();
  const resolvedQuery = computed(() => toValue(query));

  return useQuery({
    queryKey: ['shop-orders', resolvedQuery],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.list(shopId, resolvedQuery.value);
    },
  });
}
