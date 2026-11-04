import type { z } from 'zod';
import type { components } from '@arc/schemas/api/generated/openapi';
import type { OrderStatuses } from '@arc/enums/order';
import type {
  listShopOrdersRequestSchema,
  listShopOrdersResponseSchema,
  exportShopOrdersRequestSchema,
  shopOrderExportResponseSchema,
  shopOrderExportColumnSchema,
  shopOrderDetailResponseSchema,
  shopOrderSummarySchema,
  prepareFulfillmentShipmentRequestSchema,
  amendFulfillmentShipmentRequestSchema,
  purchaseShipmentLabelRequestSchema,
  reconcileOrderFulfillmentRequestSchema,
  shipmentRatesRequestSchema,
} from '@arc/schemas/api/shop/order/order.schema';
import type {
  fulfillmentMutationResponseSchema,
  shipmentRateQuoteSchema,
  shipmentRateServiceSchema,
  shipmentRatesResponseSchema,
} from '@arc/schemas/api/fulfillment/fulfillment.schema';

export type ListShopOrdersRequest = z.infer<typeof listShopOrdersRequestSchema>;
export type ExportShopOrdersRequest = z.infer<typeof exportShopOrdersRequestSchema>;
export type ShopOrderExportResponse = z.infer<typeof shopOrderExportResponseSchema>;
export type ShopOrderExportColumn = z.infer<typeof shopOrderExportColumnSchema>;
export type ShopOrderSummary = z.infer<typeof shopOrderSummarySchema>;
export type ListShopOrdersResponse = z.infer<typeof listShopOrdersResponseSchema>;
export type ShopOrderDetailResponse = z.infer<typeof shopOrderDetailResponseSchema>;
/**
 * The contract widens `status` to a plain string union; the seller UI assigns
 * and compares `OrderStatuses`, so the enum narrows the generated request.
 */
export type UpdateShopOrderStatusRequest =
  Omit<components['schemas']['UpdateShopOrderStatusDto'], 'status'> & {
    status: OrderStatuses
  };
export type PrepareFulfillmentShipmentRequest = z.infer<typeof prepareFulfillmentShipmentRequestSchema>;
export type PurchaseShipmentLabelRequest = z.infer<typeof purchaseShipmentLabelRequestSchema>;
export type AmendFulfillmentShipmentRequest = z.infer<typeof amendFulfillmentShipmentRequestSchema>;
export type ReconcileOrderFulfillmentRequest = z.infer<typeof reconcileOrderFulfillmentRequestSchema>;
export type FulfillmentMutationResponse = z.infer<typeof fulfillmentMutationResponseSchema>;
export type ShipmentRatesRequest = z.infer<typeof shipmentRatesRequestSchema>;
export type ShipmentRatesResponse = z.infer<typeof shipmentRatesResponseSchema>;
export type ShipmentRateQuote = z.infer<typeof shipmentRateQuoteSchema>;
export type ShipmentRateService = z.infer<typeof shipmentRateServiceSchema>;
export type UpdateShopOrderRefundRequest = components['schemas']['UpdateShopOrderRefundDto'];
