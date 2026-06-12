import type { z } from 'zod';
import type {
  checkoutQuoteResponseSchema,
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
  orderShopShippingSchema,
  orderSupportRequestSchema,
  paymentSchema
} from '@arc/schemas/api/me/order/order.schema';

export type Payment = z.infer<typeof paymentSchema>;
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
export type CheckoutQuoteResponse = z.infer<typeof checkoutQuoteResponseSchema>;
export type CreateCheckoutQuoteFromCartRequest = z.infer<typeof createCheckoutQuoteFromCartRequestSchema>;
export type CreateCheckoutQuoteForBuyNowRequest = z.infer<typeof createCheckoutQuoteForBuyNowRequestSchema>;
export type CreateOrderFromCartRequest = z.infer<typeof createOrderFromCartRequestSchema>;
export type CreateOrderFromCartResponse = CreateOrderResponse;
export type CreateOrderForBuyNowRequest = z.infer<typeof createOrderForBuyNowRequestSchema>;
export type CreateOrderForBuyNowResponse = CreateOrderResponse;
export type RequestOrderCancelRequest = z.infer<typeof orderCancelRequestSchema>;
export type RequestOrderSupportRequest = z.infer<typeof orderSupportRequestSchema>;

export type ResponseGetOrderShopsProduct = z.infer<typeof orderShopProductSchema>;
export type OrderShopShipping = z.infer<typeof orderShopShippingSchema>;
export type OrderShopResource = z.infer<typeof orderShopResourceSchema>;
export type MyOrderListState = z.infer<typeof myOrderListStateSchema>;

export type GetOrderShopsRequest = z.infer<typeof getOrderShopsRequestSchema>;
export type GetOrderShopsResponse = z.infer<typeof getOrderShopsResponseSchema>;
export type GetMyOrderDetailResponse = z.infer<typeof myOrderDetailResponseSchema>;

export type GetOrderShopsByCheckoutSessionRequest = z.infer<typeof getOrderShopsByCheckoutSessionRequestSchema>;
export type GetOrderShopsByCheckoutSessionResponse = z.infer<typeof getOrderShopsByCheckoutSessionResponseSchema>;
