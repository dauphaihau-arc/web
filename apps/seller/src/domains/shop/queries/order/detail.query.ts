import { getStatusCode } from '@arc/lib';
import { resolveMyShopId } from '../../utils/resolve-my-shop-id';
import { shopOrderApi } from '~/domains/shop/api/order/order.api';

export function useShopGetOrderDetail(orderId?: string) {
  const queryClient = useQueryClient();

  return useQuery({
    enabled: !!orderId,
    queryKey: ['shop-order-detail', orderId],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.detail(shopId, orderId!);
    },
    // A missing order never starts existing on retry: skip it so the not-found
    // state shows immediately, and keep retries for transient failures only.
    retry: (failureCount, error) =>
      getStatusCode(error) !== 404 && failureCount < 3,
  });
}
