import type {
  ExportShopOrdersRequest,
  ListShopOrdersRequest,
  ListShopOrdersResponse,
  ShopOrderExportResponse,
  ShopOrderDetailResponse,
  UpdateShopOrderRefundRequest,
  UpdateShopOrderStatusRequest,
  PrepareFulfillmentShipmentRequest,
  AmendFulfillmentShipmentRequest,
  UpdateShipmentJourneyRequest,
  ReconcileOrderFulfillmentRequest,
  FulfillmentMutationResponse,
} from './contracts/order.contract';
import { apiClient } from '~/domains/_shared/api-client';

/**
 * Fulfillment writes are idempotent commands: a retried request must not create a
 * second consignment, void/amend twice, or dispatch twice. The API requires an
 * idempotency key for these endpoints.
 */
function idempotentOptions() {
  return {
    headers: {
      'Idempotency-Key': crypto.randomUUID(),
    },
  };
}

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

  prepareFulfillmentShipment(
    shopId: string,
    orderId: string,
    payload: PrepareFulfillmentShipmentRequest,
  ) {
    return apiClient.post<FulfillmentMutationResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipments`,
      payload,
      idempotentOptions(),
    );
  },

  amendFulfillmentShipment(
    shopId: string,
    orderId: string,
    shipmentId: string,
    payload: AmendFulfillmentShipmentRequest,
  ) {
    return apiClient.patch<FulfillmentMutationResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipments/${shipmentId}`,
      payload,
      idempotentOptions(),
    );
  },

  voidFulfillmentShipment(
    shopId: string,
    orderId: string,
    shipmentId: string,
  ) {
    return apiClient.delete<FulfillmentMutationResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipments/${shipmentId}`,
      undefined,
      undefined,
      idempotentOptions(),
    );
  },

  updateShipmentJourney(
    shopId: string,
    orderId: string,
    shipmentId: string,
    payload: UpdateShipmentJourneyRequest,
  ) {
    return apiClient.post<FulfillmentMutationResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipments/${shipmentId}/journey`,
      payload,
      idempotentOptions(),
    );
  },

  reconcileOrderFulfillment(
    shopId: string,
    orderId: string,
    payload: ReconcileOrderFulfillmentRequest,
  ) {
    return apiClient.post<FulfillmentMutationResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/reconciliation`,
      payload,
      idempotentOptions(),
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
