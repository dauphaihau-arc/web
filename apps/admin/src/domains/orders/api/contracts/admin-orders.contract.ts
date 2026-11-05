import type { components, paths } from '@arc/schemas/api/generated/openapi';
import type { OrderStatuses } from '@arc/enums/order';

/**
 * A platform operator's view of an order. Only the platform ADMIN role can
 * reach `/admin/orders`, and the serialized payload carries every shop's
 * order rather than a single shop's projection, so these types stay separate
 * from the seller and buyer order contracts.
 */

export type AdminOrderRefundAction =
  components['schemas']['UpdateAdminOrderRefundDto']['action'];

/**
 * The contract describes `status` as a repeatable query parameter, while this
 * app encodes the selected statuses as one comma-separated value (see the order
 * list composable). The boundary keeps that serialized form so the request on
 * the wire does not change.
 */
export type ListAdminOrdersParams = Omit<
  paths['/v1/admin/orders']['get']['parameters']['query'],
  'status'
> & {
  /** Comma-separated list of {@link OrderStatuses}; a single value still works. */
  status?: string
};

export type AdminOrderShopRef = components['schemas']['OrderShopRefResponseDto'];

export type AdminOrderCustomerRef = components['schemas']['MyOrderCustomerResponseDto'];

export type AdminOrderPaymentTypeRef =
  components['schemas']['AdminOrderPaymentTypeResponseDto'];

export type AdminOrderPaymentRef = components['schemas']['AdminOrderPaymentResponseDto'];

export type AdminOrderFulfillmentStatusRef =
  components['schemas']['AdminOrderFulfillmentStatusResponseDto'];

export type AdminOrderListEntry = components['schemas']['AdminOrderListEntryResponseDto'];

export type AdminOrderListResponse = components['schemas']['AdminOrderListResponseDto'];

export type AdminOrderSelectedOptionRef =
  components['schemas']['AdminOrderSelectedOptionResponseDto'];

export type AdminOrderProductShopRef =
  components['schemas']['OrderProductShopRefResponseDto'];

export type AdminOrderProductRef = components['schemas']['AdminOrderProductRefResponseDto'];

export type AdminOrderInventoryRef = components['schemas']['OrderInventorySkuResponseDto'];

export type AdminOrderProductLine = components['schemas']['AdminOrderProductLineResponseDto'];

export type AdminOrderPromoCodeRef = components['schemas']['OrderPromoCodeResponseDto'];

export type AdminOrderFulfillmentProgress =
  components['schemas']['OrderFulfillmentProgressResponseDto'];

export type AdminOrderShipmentItemRef = components['schemas']['OrderShipmentItemResponseDto'];

export type AdminOrderShipmentUpdate =
  components['schemas']['OrderShipmentUpdateResponseDto'];

export type AdminOrderShipment = components['schemas']['OrderShipmentResponseDto'];

export type AdminOrderFulfillmentGroup =
  components['schemas']['OrderFulfillmentGroupResponseDto'];

export type AdminOrderLegacyShipping =
  components['schemas']['OrderLegacyShippingResponseDto'];

export type AdminOrderFulfillmentSummary =
  components['schemas']['OrderFulfillmentSummaryResponseDto'];

/**
 * Frozen purchase-time shipping quote. The estimate is the delivery window the
 * buyer accepted at checkout; the admin views read the order-level
 * `shipping_minor` and the estimate's `latest_delivery_date`.
 */
export type AdminOrderShippingSnapshot =
  components['schemas']['OrderShippingQuoteResponseDto'];

export type AdminOrderShippingAddress =
  components['schemas']['OrderShippingAddressResponseDto'];

export type AdminOrderDetailOrder =
  components['schemas']['AdminOrderDetailOrderResponseDto'];

export type AdminOrderDetailResponse =
  components['schemas']['AdminOrderDetailResponseDto'];

/**
 * The per-order money basis the seller settlement and platform revenue
 * surfaces read. `platform_commission_minor` is `null` when the order has no
 * journal basis yet, so callers must never substitute zero for it.
 */
export type AdminOrderFinancialBreakdown =
  components['schemas']['AdminOrderFinancialBreakdownResponseDto'];

/** Finance's payout account and automatic schedule for an order's shop. */
export type AdminOrderPayoutMethod =
  components['schemas']['OrderPayoutMethodResponseDto'];

/**
 * The contract widens `status` to a plain string union; the admin UI assigns
 * and compares `OrderStatuses`, so the enum narrows the generated request.
 */
export type UpdateAdminOrderStatusBody =
  Omit<components['schemas']['UpdateAdminOrderStatusDto'], 'status'> & {
    status: OrderStatuses
  };

export type UpdateAdminOrderRefundBody =
  components['schemas']['UpdateAdminOrderRefundDto'];
