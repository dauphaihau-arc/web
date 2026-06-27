import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import type {
  CheckoutQuoteResponse,
  CreateCheckoutQuoteForBuyNowRequest,
  CreateCheckoutQuoteFromCartRequest,
  CreateOrderForBuyNowRequest,
  CreateOrderForBuyNowResponse,
  CreateOrderFromCartRequest,
  CreateOrderFromCartResponse,
  GetOrderShopsByCheckoutSessionResponse,
} from '../order/contracts/order.contract'
import { apiClient } from '~/shared/lib/api-client'

export const meCheckoutApi = {
  createQuoteForBuyNow(payload: CreateCheckoutQuoteForBuyNowRequest) {
    return apiClient.post<CheckoutQuoteResponse>(
      '/me/checkout/buy-now/quote',
      payload,
    )
  },

  createQuoteFromCart(payload: CreateCheckoutQuoteFromCartRequest) {
    return apiClient.post<CheckoutQuoteResponse>(
      '/me/checkout/quote',
      payload,
    )
  },

  createForBuyNow(payload: CreateOrderForBuyNowRequest) {
    return apiClient.put<CreateOrderForBuyNowResponse>(
      '/me/checkout/buy-now',
      payload,
    )
  },

  createFromCart(payload: CreateOrderFromCartRequest) {
    return apiClient.post<CreateOrderFromCartResponse>(
      '/me/checkout',
      payload,
    )
  },

  getShopsByCheckoutSession(
    sessionId: string,
    options?: NitroFetchOptions<NitroFetchRequest>,
  ) {
    return apiClient.get<GetOrderShopsByCheckoutSessionResponse>(
      '/me/checkout/session',
      { session_id: sessionId },
      options,
      { retryOnWakeUp: true },
    )
  },
}
