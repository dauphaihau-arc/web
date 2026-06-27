import type {
  GetMyOrderDetailResponse,
  GetOrderShopsRequest,
  GetOrderShopsResponse,
  RequestOrderCancelRequest,
  RequestOrderSupportRequest,
} from './contracts/order.contract'
import { apiClient } from '~/shared/lib/api-client'

export const meOrdersApi = {
  getShops(params?: GetOrderShopsRequest) {
    return apiClient.get<GetOrderShopsResponse>(
      '/me/orders',
      params,
    )
  },

  getById(orderId: string) {
    return apiClient.get<GetMyOrderDetailResponse>(
      `/me/orders/${orderId}`,
    )
  },

  requestCancel(orderId: string, payload: RequestOrderCancelRequest) {
    return apiClient.patch<GetMyOrderDetailResponse>(
      `/me/orders/${orderId}/cancel-request`,
      payload,
    )
  },

  requestSupport(orderId: string, payload: RequestOrderSupportRequest) {
    return apiClient.patch<GetMyOrderDetailResponse>(
      `/me/orders/${orderId}/support-request`,
      payload,
    )
  },
}
