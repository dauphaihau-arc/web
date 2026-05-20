import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { meOrdersApi } from '~/shared/api/me/orders/me-orders.api';
import type {
  GetOrderShopsByCheckoutSessionResponse
} from '~/shared/api/me/orders/get-order-shops-by-checkout-session';
import type { RequestGetListParams } from '~/shared/types/common';

export function useGetOrderShops(queryParams?: RequestGetListParams) {
  return useQuery({
    queryKey: ['get-order-shops'],
    queryFn: () => {
      return meOrdersApi.getShops(queryParams);
    },
    enabled: !!queryParams,
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
      return meOrdersApi.getShopsByCheckoutSession(
        sessionId!,
        options
      ) as Promise<GetOrderShopsByCheckoutSessionResponse>;
    },
  });
}
