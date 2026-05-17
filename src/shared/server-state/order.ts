import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { RESOURCES } from '~/shared/config/enums/resources';
import { apiClient } from '~/shared/lib/api-client';
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
      return apiClient.put<ResponseCreateOrder>(
        `${RESOURCES.USER}${RESOURCES.ORDERS}`,
        body
      );
    },
  });
}

export function useCreateOrderFromCart() {
  return useMutation({
    mutationFn: (body: CreateOrderFromCartBody) => {
      return apiClient.post<ResponseCreateOrder>(
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
      return apiClient.get<ResponseGetOrderShops>(
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
      return apiClient.delete<ResponseGetOrderShopsByCheckoutSession>(
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
