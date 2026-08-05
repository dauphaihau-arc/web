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
  updateShopOrderShipmentRequestSchema,
  updateShopOrderStatusRequestSchema
} from '@arc/schemas/api/shop/order/order.schema';

export type ListShopOrdersRequest = z.infer<typeof listShopOrdersRequestSchema>;
export type ExportShopOrdersRequest = z.infer<typeof exportShopOrdersRequestSchema>;
export type ShopOrderExportResponse = z.infer<typeof shopOrderExportResponseSchema>;
export type ShopOrderExportColumn = z.infer<typeof shopOrderExportColumnSchema>;
export type ShopOrderSummary = z.infer<typeof shopOrderSummarySchema>;
export type ListShopOrdersResponse = z.infer<typeof listShopOrdersResponseSchema>;
export type ShopOrderDetailResponse = z.infer<typeof shopOrderDetailResponseSchema>;
export type UpdateShopOrderStatusRequest = z.infer<typeof updateShopOrderStatusRequestSchema>;
export type UpdateShopOrderShipmentRequest = z.infer<typeof updateShopOrderShipmentRequestSchema>;
export type UpdateShopOrderRefundRequest = z.infer<typeof updateShopOrderRefundRequestSchema>;
