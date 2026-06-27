import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { meCheckoutApi } from '~/shared/api/me/checkout/me-checkout.api';
import { meOrdersApi } from '~/shared/api/me/order/me-orders.api';
import type {
  GetOrderShopsRequest,
  GetMyOrderDetailResponse,
  GetOrderShopsByCheckoutSessionResponse
} from '~/shared/api/me/order/contracts/order.contract';

export function useGetOrderShops(queryParams?: MaybeRefOrGetter<GetOrderShopsRequest | undefined>) {
  return useQuery({
    queryKey: computed(() => ['get-order-shops', toValue(queryParams)]),
    queryFn: () => {
      return meOrdersApi.getShops(toValue(queryParams));
    },
    enabled: computed(() => !!toValue(queryParams)),
  });
}

export function useGetOrderById(orderId?: string) {
  return useQuery({
    enabled: !!orderId,
    queryKey: ['get-order-by-id', orderId],
    queryFn: () => {
      return meOrdersApi.getById(orderId!) as Promise<GetMyOrderDetailResponse>;
    },
  });
}

export function useGetOrderShopsByCheckoutSession(
  sessionId?: string,
  options?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery({
    enabled: !!sessionId,
    queryKey: ['verify-cs'],
    queryFn: () => {
      return meCheckoutApi.getShopsByCheckoutSession(
        sessionId!,
        options
      ) as Promise<GetOrderShopsByCheckoutSessionResponse>;
    },
  });
}
