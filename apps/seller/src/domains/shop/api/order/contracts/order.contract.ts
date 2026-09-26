import type { z } from 'zod';
import type {
  listShopOrdersRequestSchema,
  listShopOrdersResponseSchema,
  exportShopOrdersRequestSchema,
  shopOrderExportResponseSchema,
  shopOrderExportColumnSchema,
  shopOrderDetailResponseSchema,
  updateShopOrderRefundRequestSchema,
  shopOrderSummarySchema,
  updateShopOrderStatusRequestSchema,
  prepareFulfillmentShipmentRequestSchema,
  amendFulfillmentShipmentRequestSchema,
  updateShipmentJourneyRequestSchema,
  reconcileOrderFulfillmentRequestSchema,
} from '@arc/schemas/api/shop/order/order.schema';
import type { fulfillmentMutationResponseSchema } from '@arc/schemas/api/fulfillment/fulfillment.schema';

export type ListShopOrdersRequest = z.infer<typeof listShopOrdersRequestSchema>;
export type ExportShopOrdersRequest = z.infer<typeof exportShopOrdersRequestSchema>;
export type ShopOrderExportResponse = z.infer<typeof shopOrderExportResponseSchema>;
export type ShopOrderExportColumn = z.infer<typeof shopOrderExportColumnSchema>;
export type ShopOrderSummary = z.infer<typeof shopOrderSummarySchema>;
export type ListShopOrdersResponse = z.infer<typeof listShopOrdersResponseSchema>;
export type ShopOrderDetailResponse = z.infer<typeof shopOrderDetailResponseSchema>;
export type UpdateShopOrderStatusRequest = z.infer<typeof updateShopOrderStatusRequestSchema>;
export type PrepareFulfillmentShipmentRequest = z.infer<typeof prepareFulfillmentShipmentRequestSchema>;
export type AmendFulfillmentShipmentRequest = z.infer<typeof amendFulfillmentShipmentRequestSchema>;
export type UpdateShipmentJourneyRequest = z.infer<typeof updateShipmentJourneyRequestSchema>;
export type ReconcileOrderFulfillmentRequest = z.infer<typeof reconcileOrderFulfillmentRequestSchema>;
export type FulfillmentMutationResponse = z.infer<typeof fulfillmentMutationResponseSchema>;
export type UpdateShopOrderRefundRequest = z.infer<typeof updateShopOrderRefundRequestSchema>;
