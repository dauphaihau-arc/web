import type {
  ListShopOrdersRequest,
  ListShopOrdersResponse,
  ShopOrderDetailResponse,
  UpdateShopOrderShipmentRequest,
  UpdateShopOrderStatusRequest
} from './contracts/order.contract';
import { apiClient } from '~/shared/lib/api-client';

export const shopOrderApi = {
  list(shopId: string, query?: ListShopOrdersRequest) {
    return apiClient.get<ListShopOrdersResponse>(
      `/shops/${shopId}/orders`,
      query
    );
  },

  detail(shopId: string, orderId: string) {
    return apiClient.get<ShopOrderDetailResponse>(
      `/shops/${shopId}/orders/${orderId}`
    );
  },

  updateStatus(
    shopId: string,
    orderId: string,
    payload: UpdateShopOrderStatusRequest
  ) {
    return apiClient.patch<ShopOrderDetailResponse>(
      `/shops/${shopId}/orders/${orderId}/status`,
      payload
    );
  },

  updateShipment(
    shopId: string,
    orderId: string,
    payload: UpdateShopOrderShipmentRequest
  ) {
    return apiClient.patch<ShopOrderDetailResponse>(
      `/shops/${shopId}/orders/${orderId}/shipment`,
      payload
    );
  },
};
