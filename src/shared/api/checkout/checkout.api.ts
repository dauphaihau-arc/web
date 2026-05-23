import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type {
  CreateGuestOrderForBuyNowRequest,
  CreateGuestOrderFromCartRequest,
  CreateGuestOrderResponse,
  GetCheckoutOrderShopsBySessionResponse
} from './contracts/checkout.contract';
import type {
  GetGuestOrderLookupRequest,
  GetGuestOrderLookupResponse
} from './contracts/guest-orders.contract';
import { apiClient } from '~/shared/lib/api-client';

export const checkoutApi = {
  createFromCart(payload: CreateGuestOrderFromCartRequest) {
    return apiClient.post<CreateGuestOrderResponse>(
      '/checkout/cart',
      payload
    );
  },

  createForBuyNow(payload: CreateGuestOrderForBuyNowRequest) {
    return apiClient.post<CreateGuestOrderResponse>(
      '/checkout/buy-now',
      payload
    );
  },

  getShopsByCheckoutSession(
    sessionId: string,
    options?: NitroFetchOptions<NitroFetchRequest>
  ) {
    return apiClient.get<GetCheckoutOrderShopsBySessionResponse>(
      `/checkout/session/${sessionId}`,
      undefined,
      options,
      { retryOnWakeUp: true }
    );
  },

  lookupGuestOrders(
    params: GetGuestOrderLookupRequest,
    options?: NitroFetchOptions<NitroFetchRequest>
  ) {
    return apiClient.get<GetGuestOrderLookupResponse>(
      '/checkout/guest-orders',
      params,
      options,
      { retryOnWakeUp: true }
    );
  },
};
