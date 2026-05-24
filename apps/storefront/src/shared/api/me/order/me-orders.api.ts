import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  CreateOrderForBuyNowRequest,
  CreateOrderForBuyNowResponse
  ,
  CreateOrderFromCartRequest,
  CreateOrderFromCartResponse
  ,
  GetMyOrderDetailResponse,
  GetOrderShopsByCheckoutSessionResponse,
  GetOrderShopsRequest,
  GetOrderShopsResponse,
  RequestOrderCancelRequest,
  RequestOrderSupportRequest
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

  getById(orderId: string) {
    return apiClient.get<GetMyOrderDetailResponse>(
      `/me/orders/${orderId}`
    );
  },

  requestCancel(orderId: string, payload: RequestOrderCancelRequest) {
    return apiClient.patch<GetMyOrderDetailResponse>(
      `/me/orders/${orderId}/cancel-request`,
      payload
    );
  },

  requestSupport(orderId: string, payload: RequestOrderSupportRequest) {
    return apiClient.patch<GetMyOrderDetailResponse>(
      `/me/orders/${orderId}/support-request`,
      payload
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
