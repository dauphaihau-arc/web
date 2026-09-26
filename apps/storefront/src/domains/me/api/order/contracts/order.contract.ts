import type { z } from 'zod';
import type {
  checkoutQuoteResponseSchema,
  checkoutQuoteShopSchema,
  createCheckoutQuoteForBuyNowRequestSchema,
  createCheckoutQuoteFromCartRequestSchema,
  createOrderForBuyNowRequestSchema,
  createOrderFromCartRequestSchema,
  createOrderResponseSchema,
  getOrderShopsRequestSchema,
  getOrderShopsByCheckoutSessionRequestSchema,
  getOrderShopsByCheckoutSessionResponseSchema,
  getOrderShopsResponseSchema,
  myOrderListStateSchema,
  myOrderDetailResponseSchema,
  orderCancelRequestSchema,
  orderShopProductSchema,
  orderShopResourceSchema,
  orderSupportRequestSchema,
  paymentSchema,
} from '@arc/schemas/api/me/order/order.schema';
import type {
  fulfillmentGroupSchema,
  fulfillmentShipmentSchema,
  fulfillmentShipmentItemSchema,
  fulfillmentShipmentUpdateSchema,
  legacyOrderShippingSchema,
  orderFulfillmentSchema,
} from '@arc/schemas/api/fulfillment/fulfillment.schema';
import type {
  checkoutShippingQuoteSchema,
  shippingDiscountSchema,
  shippingQuoteChargeSchema,
} from '@arc/schemas/shipping-quote.schema';

export type Payment = z.infer<typeof paymentSchema>;
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
export type CheckoutQuoteResponse = z.infer<typeof checkoutQuoteResponseSchema>;
export type CheckoutQuoteShop = z.infer<typeof checkoutQuoteShopSchema>;
export type CheckoutShippingQuote = z.infer<typeof checkoutShippingQuoteSchema>;
export type ShippingQuoteCharge = z.infer<typeof shippingQuoteChargeSchema>;
export type ShippingDiscount = z.infer<typeof shippingDiscountSchema>;
export type CreateCheckoutQuoteFromCartRequest = z.infer<typeof createCheckoutQuoteFromCartRequestSchema>;
export type CreateCheckoutQuoteForBuyNowRequest = z.infer<typeof createCheckoutQuoteForBuyNowRequestSchema>;
export type CreateOrderFromCartRequest = z.infer<typeof createOrderFromCartRequestSchema>;
export type CreateOrderFromCartResponse = CreateOrderResponse;
export type CreateOrderForBuyNowRequest = z.infer<typeof createOrderForBuyNowRequestSchema>;
export type CreateOrderForBuyNowResponse = CreateOrderResponse;
export type RequestOrderCancelRequest = z.infer<typeof orderCancelRequestSchema>;
export type RequestOrderSupportRequest = z.infer<typeof orderSupportRequestSchema>;

export type ResponseGetOrderShopsProduct = z.infer<typeof orderShopProductSchema>;
export type OrderShopResource = z.infer<typeof orderShopResourceSchema>;
export type MyOrderListState = z.infer<typeof myOrderListStateSchema>;

export type OrderFulfillment = z.infer<typeof orderFulfillmentSchema>;
export type FulfillmentGroup = z.infer<typeof fulfillmentGroupSchema>;
export type FulfillmentShipment = z.infer<typeof fulfillmentShipmentSchema>;
export type FulfillmentShipmentItem = z.infer<typeof fulfillmentShipmentItemSchema>;
export type FulfillmentShipmentUpdate = z.infer<typeof fulfillmentShipmentUpdateSchema>;
export type LegacyOrderShipping = z.infer<typeof legacyOrderShippingSchema>;

export type GetOrderShopsRequest = z.infer<typeof getOrderShopsRequestSchema>;
export type GetOrderShopsResponse = z.infer<typeof getOrderShopsResponseSchema>;
export type GetMyOrderDetailResponse = z.infer<typeof myOrderDetailResponseSchema>;

export type GetOrderShopsByCheckoutSessionRequest = z.infer<typeof getOrderShopsByCheckoutSessionRequestSchema>;
export type GetOrderShopsByCheckoutSessionResponse = z.infer<typeof getOrderShopsByCheckoutSessionResponseSchema>;
