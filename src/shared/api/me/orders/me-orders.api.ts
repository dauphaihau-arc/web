import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  CreateOrderForBuyNowRequest,
  CreateOrderForBuyNowResponse
} from './create-order-buy-now';
import type {
  CreateOrderFromCartRequest,
  CreateOrderFromCartResponse
} from './create-order-from-cart';
import type { GetOrderShopsByCheckoutSessionResponse } from './get-order-shops-by-checkout-session';
import type { GetOrderShopsRequest, GetOrderShopsResponse } from './get-order-shops';
import { apiClient } from '~/shared/lib/api-client';

export const meOrdersApi = {
  createForBuyNow(payload: CreateOrderForBuyNowRequest) {
    return apiClient.put<CreateOrderForBuyNowResponse>(
      '/user/orders',
      payload
    );
  },

  createFromCart(payload: CreateOrderFromCartRequest) {
    return apiClient.post<CreateOrderFromCartResponse>(
      '/user/orders',
      payload
    );
  },

  getShops(params?: GetOrderShopsRequest) {
    return apiClient.get<GetOrderShopsResponse>(
      '/user/orders',
      params
    );
  },

  getShopsByCheckoutSession(
    sessionId: string,
    options?: NitroFetchOptions<NitroFetchRequest>
  ) {
    return apiClient.delete<GetOrderShopsByCheckoutSessionResponse>(
      '/user/orders',
      { session_id: sessionId },
      undefined,
      options,
      { retryOnWakeUp: true }
    );
  },
};
