import type { components, operations } from '@arc/schemas/api/generated/openapi';
import type { z } from 'zod';
import type {
  checkoutShippingQuoteSchema,
  shippingDiscountSchema,
  shippingQuoteChargeSchema,
} from '@arc/schemas/shipping-quote.schema';
import type {
  FulfillmentAggregateStatuses,
  FulfillmentMethods,
  FulfillmentOperators,
  FulfillmentProvenances,
  ShipmentStatuses,
  ShipmentUpdateActorTypes,
  ShipmentUpdateSources,
} from '@arc/enums/fulfillment';
import type { OrderStatuses, PaymentTypes } from '@arc/enums/order';

type ApiOrderShop = components['schemas']['OrderShopEntryResponseDto'];
type ApiOrderPayment = components['schemas']['OrderPaymentResponseDto'];
type ApiOrderFulfillment = components['schemas']['OrderFulfillmentSummaryResponseDto'];
type ApiOrderFulfillmentGroup = components['schemas']['OrderFulfillmentGroupResponseDto'];
type ApiOrderShipment = components['schemas']['OrderShipmentResponseDto'];
type ApiOrderShipmentUpdate = components['schemas']['OrderShipmentUpdateResponseDto'];
type ApiMyOrderDetail = components['schemas']['MyOrderDetailResponseDto'];
type ApiMyOrderDetailOrderShop = components['schemas']['MyOrderDetailOrderShopResponseDto'];
type ApiOrderFromCartRequest = components['schemas']['CreateOrderFromCartDto'];
type ApiOrderForBuyNowRequest = components['schemas']['CreateOrderForBuyNowDto'];
type MeOrderListQuery = NonNullable<operations['MeOrder_list']['parameters']['query']>;

/**
 * The contract types most enum-valued response fields as plain `string`. The app
 * compares and indexes them by the `@arc/enums` members, so each field keeps its
 * enum type here instead of a cast at every call site.
 */
export type Payment = Omit<ApiOrderPayment, 'type' | 'refund_status'> & {
  type: PaymentTypes
  refund_status?: 'pending' | 'succeeded' | 'failed' | 'not_required'
};

export type FulfillmentShipmentItem = components['schemas']['OrderShipmentItemResponseDto'];

export type FulfillmentShipmentUpdate =
  Omit<ApiOrderShipmentUpdate, 'status' | 'actor_type' | 'source'> &
  {
    status: ShipmentStatuses
    actor_type: ShipmentUpdateActorTypes
    source: ShipmentUpdateSources
  };

export type FulfillmentShipment = Omit<ApiOrderShipment, 'status' | 'updates'> & {
  status: ShipmentStatuses
  updates: FulfillmentShipmentUpdate[]
};

export type FulfillmentGroup =
  Omit<ApiOrderFulfillmentGroup, 'method' | 'operator' | 'provenance' | 'shipments'> &
  {
    method: FulfillmentMethods
    operator: FulfillmentOperators
    provenance: FulfillmentProvenances
    shipments: FulfillmentShipment[]
  };

export type OrderFulfillment = Omit<ApiOrderFulfillment, 'status' | 'groups'> & {
  status: FulfillmentAggregateStatuses
  groups: FulfillmentGroup[]
};

export type LegacyOrderShipping = components['schemas']['OrderLegacyShippingResponseDto'];

export type OrderShopResource = Omit<ApiOrderShop, 'status' | 'payment' | 'fulfillment'> & {
  status: OrderStatuses
  payment: Payment
  fulfillment: OrderFulfillment
};

export type CreateOrderResponse = components['schemas']['CreateOrderResponseDto'];
export type CheckoutQuoteResponse = components['schemas']['CheckoutQuoteResponseDto'];
export type CheckoutQuoteShop = components['schemas']['CheckoutQuoteShopResponseDto'];
export type CheckoutShippingQuote = z.infer<typeof checkoutShippingQuoteSchema>;
export type ShippingQuoteCharge = z.infer<typeof shippingQuoteChargeSchema>;
export type ShippingDiscount = z.infer<typeof shippingDiscountSchema>;
export type CreateCheckoutQuoteFromCartRequest =
  components['schemas']['CreateCheckoutQuoteFromCartDto'];
export type CreateCheckoutQuoteForBuyNowRequest =
  components['schemas']['CreateCheckoutQuoteForBuyNowDto'];
export type CreateOrderFromCartRequest =
  Omit<ApiOrderFromCartRequest, 'payment_type'> & { payment_type: PaymentTypes };
export type CreateOrderFromCartResponse = CreateOrderResponse;
export type CreateOrderForBuyNowRequest =
  Omit<ApiOrderForBuyNowRequest, 'payment_type'> & { payment_type: PaymentTypes };
export type CreateOrderForBuyNowResponse = CreateOrderResponse;
export type RequestOrderCancelRequest = components['schemas']['RequestOrderCancelDto'];
export type RequestOrderSupportRequest = components['schemas']['RequestOrderSupportDto'];

export type ResponseGetOrderShopsProduct = components['schemas']['OrderProductLineResponseDto'];
export type MyOrderListState = Exclude<MeOrderListQuery['state'], undefined>;

export type GetOrderShopsRequest = MeOrderListQuery;
export type GetOrderShopsResponse =
  Omit<components['schemas']['OrderListResponseDto'], 'order_shops'> &
  { order_shops: OrderShopResource[] };

type MyOrderDetailOrderShop =
  Omit<ApiMyOrderDetailOrderShop, 'status' | 'payment' | 'fulfillment'> & {
    status: OrderStatuses
    payment: Payment
    fulfillment: OrderFulfillment
  };

export type GetMyOrderDetailResponse =
  Omit<ApiMyOrderDetail, 'order_shop'> & { order_shop: MyOrderDetailOrderShop };

export type GetOrderShopsByCheckoutSessionRequest = NonNullable<
  operations['MeCheckout_getByCheckoutSession']['parameters']['query']
>;
export type GetOrderShopsByCheckoutSessionResponse =
  components['schemas']['CheckoutSessionOrderResponseDto'];
