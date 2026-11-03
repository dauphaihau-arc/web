import type {
  ExportShopOrdersRequest,
  ListShopOrdersRequest,
  ListShopOrdersResponse,
  ShopOrderExportResponse,
  ShopOrderDetailResponse,
  UpdateShopOrderRefundRequest,
  UpdateShopOrderStatusRequest,
  PrepareFulfillmentShipmentRequest,
  PurchaseShipmentLabelRequest,
  AmendFulfillmentShipmentRequest,
  ReconcileOrderFulfillmentRequest,
  FulfillmentMutationResponse,
  ShipmentRatesRequest,
  ShipmentRatesResponse,
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

  /**
   * A Rate Quote is a read-only carrier price for package facts, so it carries
   * no idempotency key and creates nothing.
   */
  shipmentRates(
    shopId: string,
    orderId: string,
    payload: ShipmentRatesRequest,
  ) {
    return apiClient.post<ShipmentRatesResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipment-rates`,
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

  /**
   * Buys the carrier label for a Rate Quote. The quote is single-use, so the
   * request carries an idempotency key: a transport retry must not buy twice.
   */
  buyLabel(
    shopId: string,
    orderId: string,
    payload: PurchaseShipmentLabelRequest,
  ) {
    return apiClient.post<FulfillmentMutationResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipments/label`,
      payload,
      idempotentOptions(),
    );
  },

  downloadLabel(shopId: string, orderId: string, shipmentId: string) {
    return apiClient.get<Blob>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipments/${shipmentId}/label.pdf`,
      undefined,
      { responseType: 'blob' },
    );
  },

  /**
   * Refunds the carrier label and voids the Shipment. Like every fulfillment
   * write it carries an idempotency key: a retried refund must stay a refund,
   * not refund twice.
   */
  refundLabel(shopId: string, orderId: string, shipmentId: string) {
    return apiClient.delete<FulfillmentMutationResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipments/${shipmentId}/label`,
      undefined,
      undefined,
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

  /**
   * The seller's only status authority: declaring that the prepared Shipment was
   * handed to its carrier. Everything after handover is carrier evidence.
   */
  declareShipmentHandover(
    shopId: string,
    orderId: string,
    shipmentId: string,
  ) {
    return apiClient.post<FulfillmentMutationResponse>(
      `/shops/${shopId}/orders/${orderId}/fulfillment/shipments/${shipmentId}/handover`,
      {},
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
