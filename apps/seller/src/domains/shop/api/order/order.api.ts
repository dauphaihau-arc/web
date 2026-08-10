import type {
  ExportShopOrdersRequest,
  ListShopOrdersRequest,
  ListShopOrdersResponse,
  ShopOrderExportResponse,
  ShopOrderDetailResponse,
  UpdateShopOrderRefundRequest,
  UpdateShopOrderShipmentRequest,
  UpdateShopOrderStatusRequest,
} from './contracts/order.contract';
import { apiClient } from '~/shared/lib/api-client';

export const shopOrderApi = {
  list(shopId: string, query?: ListShopOrdersRequest) {
    return apiClient.get<ListShopOrdersResponse>(
      `/shops/${shopId}/orders`,
      query,
    );
  },

  exportCsv(shopId: string, query?: ExportShopOrdersRequest) {
    return apiClient.get<Blob>(
      `/shops/${shopId}/orders/export`,
      query,
      { responseType: 'blob' },
    );
  },

  startExport(shopId: string, body: ExportShopOrdersRequest) {
    return apiClient.post<ShopOrderExportResponse>(
      `/shops/${shopId}/orders/exports`,
      body,
    );
  },

  getExport(shopId: string, exportId: string) {
    return apiClient.get<ShopOrderExportResponse>(
      `/shops/${shopId}/orders/exports/${exportId}`,
    );
  },

  downloadExport(shopId: string, exportId: string) {
    return apiClient.get<Blob>(
      `/shops/${shopId}/orders/exports/${exportId}/download`,
      undefined,
      { responseType: 'blob' },
    );
  },

  detail(shopId: string, orderId: string) {
    return apiClient.get<ShopOrderDetailResponse>(
      `/shops/${shopId}/orders/${orderId}`,
    );
  },

  updateStatus(
    shopId: string,
    orderId: string,
    payload: UpdateShopOrderStatusRequest,
  ) {
    return apiClient.patch<ShopOrderDetailResponse>(
      `/shops/${shopId}/orders/${orderId}/status`,
      payload,
    );
  },

  updateShipment(
    shopId: string,
    orderId: string,
    payload: UpdateShopOrderShipmentRequest,
  ) {
    return apiClient.patch<ShopOrderDetailResponse>(
      `/shops/${shopId}/orders/${orderId}/shipment`,
      payload,
    );
  },

  updateRefund(
    shopId: string,
    orderId: string,
    payload: UpdateShopOrderRefundRequest,
  ) {
    return apiClient.patch<ShopOrderDetailResponse>(
      `/shops/${shopId}/orders/${orderId}/refund`,
      payload,
    );
  },
};
