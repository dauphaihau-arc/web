import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  CreateOrderForBuyNowRequest,
  CreateOrderForBuyNowResponse
  ,
  CreateOrderFromCartRequest,
  CreateOrderFromCartResponse
  ,
  GetOrderShopsByCheckoutSessionResponse,
  GetOrderShopsRequest,
  GetOrderShopsResponse
} from './contracts/order.contract';
import { apiClient } from '~/shared/lib/api-client';

export const meOrdersApi = {
  createForBuyNow(payload: CreateOrderForBuyNowRequest) {
    return apiClient.put<CreateOrderForBuyNowResponse>(
      '/me/orders',
      payload
    );
  },

  createFromCart(payload: CreateOrderFromCartRequest) {
    return apiClient.post<CreateOrderFromCartResponse>(
      '/me/orders',
      payload
    );
  },

  getShops(params?: GetOrderShopsRequest) {
    return apiClient.get<GetOrderShopsResponse>(
      '/me/orders',
      params
    );
  },

  getShopsByCheckoutSession(
    sessionId: string,
    options?: NitroFetchOptions<NitroFetchRequest>
  ) {
    return apiClient.delete<GetOrderShopsByCheckoutSessionResponse>(
      '/me/orders',
      { session_id: sessionId },
      undefined,
      options,
      { retryOnWakeUp: true }
    );
  },
};
