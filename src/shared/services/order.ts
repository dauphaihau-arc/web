import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { RESOURCES } from '~/shared/config/enums/resources';
import type {
  CreateOrderFromCartBody,
  CreateOrderForBuyNowBody,
  ResponseCreateOrder,
  ResponseGetOrderShops,
  ResponseGetOrderShopsByCheckoutSession
} from '~/shared/types/request-api/order';
import type { RequestGetListParams } from '~/shared/types/common';

export function useCreateOrderForBuyNow() {
  return useMutation({
    mutationFn: (body: CreateOrderForBuyNowBody) => {
      return useCustomFetch.put<ResponseCreateOrder>(
        `${RESOURCES.USER}${RESOURCES.ORDERS}`,
        body
      );
    },
  });
}

export function useCreateOrderFromCart() {
  return useMutation({
    mutationFn: (body: CreateOrderFromCartBody) => {
      return useCustomFetch.post<ResponseCreateOrder>(
        `${RESOURCES.USER}${RESOURCES.ORDERS}`,
        body
      );
    },
  });
}

export function useGetOrderShops(queryParams?: RequestGetListParams) {
  return useQuery({
    queryKey: ['get-order-shops'],
    queryFn: () => {
      return useCustomFetch.get<ResponseGetOrderShops>(
        `${RESOURCES.USER}${RESOURCES.ORDERS}`,
        queryParams
      );
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
      return useCustomFetch.delete<ResponseGetOrderShopsByCheckoutSession>(
        `${RESOURCES.USER}${RESOURCES.ORDERS}`,
        {
          session_id: sessionId,
        },
        undefined,
        options,
        { retryOnWakeUp: true }
      );
    },
  });
}
