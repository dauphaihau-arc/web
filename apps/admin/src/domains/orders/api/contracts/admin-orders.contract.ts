import type { OrderStatuses } from '@arc/enums/order';

/**
 * A platform operator's view of an order. Only the platform ADMIN role can
 * reach `/admin/orders`, and the serialized payload carries every shop's
 * order rather than a single shop's projection, so these types stay separate
 * from the seller and buyer order contracts.
 */

export type AdminOrderRefundAction =
  | 'retry'
  | 'mark_succeeded'
  | 'mark_failed'
  | 'mark_not_required';

export type ListAdminOrdersParams = {
  page: number
  limit: number
  /** Comma-separated list of {@link OrderStatuses}; a single value still works. */
  status?: string
  search?: string
};

export interface AdminOrderShopRef {
  id: string
  shop_name: string
  slug: string
}

export interface AdminOrderCustomerRef {
  email: string
}

export interface AdminOrderPaymentTypeRef {
  type: string
}

export interface AdminOrderPaymentRef {
  type: string
  details: Record<string, unknown> | null
}

export interface AdminOrderFulfillmentStatusRef {
  status: string
}

export interface AdminOrderListEntry {
  id: string
  order_number: string
  shop: AdminOrderShopRef
  customer: AdminOrderCustomerRef
  payment: AdminOrderPaymentTypeRef
  status: string
  fulfillment: AdminOrderFulfillmentStatusRef
  currency: string
  total_minor: number
  cancel_reason?: string
  refunded_at?: string
  created_at: string
}

export interface AdminOrderListResponse {
  results: AdminOrderListEntry[]
  page: number
  limit: number
  total_pages: number
  total_results: number
}

export interface AdminOrderSelectedOptionRef {
  option_id: string
  option_name: string
  value_id: string
  value: string
}

export interface AdminOrderProductShopRef {
  slug: string
}

export interface AdminOrderProductRef {
  id: string
  slug: string
  shop: AdminOrderProductShopRef
  selected_options: AdminOrderSelectedOptionRef[]
  /** Reserved by the API; always an empty object. */
  shipping: Record<string, never>
}

export interface AdminOrderInventoryRef {
  sku?: string
}

export interface AdminOrderProductLine {
  product: AdminOrderProductRef
  inventory: AdminOrderInventoryRef
  /** Order item internal id. */
  id: string
  title: string
  image_url?: string
  quantity: number
  amount_minor: number
  original_amount_minor: number
  promo_discount_minor: number
  currency: string
}

export interface AdminOrderPromoCodeRef {
  id: string
  code: string
}

export interface AdminOrderFulfillmentProgress {
  ordered: number
  prepared: number
  dispatched: number
  delivered: number
  canceled: number
  outstanding: number
}

export interface AdminOrderShipmentItemRef {
  order_item_id: string
  quantity: number
}

export interface AdminOrderShipmentUpdate {
  id: string
  status: string
  actor_type: string
  actor_id?: string
  source?: string
  occurred_at: string
  note?: string
}

export interface AdminOrderShipment {
  id: string
  group_id: string
  status: string
  carrier?: string
  tracking_number?: string
  shipment_note?: string
  origin_countries: string[]
  prepared_at: string
  dispatched_at?: string
  delivered_at?: string
  voided_at?: string
  created_at: string
  updated_at: string
  items: AdminOrderShipmentItemRef[]
  updates: AdminOrderShipmentUpdate[]
}

export interface AdminOrderFulfillmentGroup {
  id: string
  method: string
  operator: string
  provenance: string
  items: AdminOrderShipmentItemRef[]
  progress: AdminOrderFulfillmentProgress
  shipments: AdminOrderShipment[]
}

export interface AdminOrderLegacyShipping {
  status: string
  updated_at: string
  to_country: string
  from_countries: string[]
  estimated_delivery?: string
  tracking_number?: string
  carrier?: string
  note?: string
  shipped_at?: string
  delivered_at?: string
}

export interface AdminOrderFulfillmentSummary {
  status: string
  requires_reconciliation: boolean
  progress: AdminOrderFulfillmentProgress
  groups: AdminOrderFulfillmentGroup[]
  legacy_shipping: AdminOrderLegacyShipping
}

/**
 * Frozen purchase-time shipping quote. The estimate is the delivery window the
 * buyer accepted at checkout; the remaining quote fields stay opaque because
 * the admin views read the order-level `shipping_minor` instead.
 */
export interface AdminOrderShippingSnapshot extends Record<string, unknown> {
  estimate?: { latest_delivery_date?: string }
}

export interface AdminOrderShippingAddress {
  full_name: string
  address1: string
  address2?: string
  city: string
  country: string
  state: string
  zip: string
  phone?: string
}

export interface AdminOrderDetailOrder {
  id: string
  order_number: string
  shop: AdminOrderShopRef
  customer: AdminOrderCustomerRef
  payment: AdminOrderPaymentRef
  status: string
  products: AdminOrderProductLine[]
  promo_codes: AdminOrderPromoCodeRef[]
  fulfillment: AdminOrderFulfillmentSummary
  shipping_address: AdminOrderShippingAddress
  /** Frozen purchase-time quote snapshot; the admin views read `shipping_minor`. */
  shipping?: AdminOrderShippingSnapshot
  shipping_discount_minor?: number
  shipping_discounts?: Array<Record<string, unknown>>
  note?: string
  canceled_at?: string
  cancel_reason?: string
  refunded_at?: string
  created_at: string
  currency: string
  subtotal_minor: number
  shipping_minor: number
  discount_minor: number
  sale_discount_minor: number
  total_minor: number
}

export interface AdminOrderDetailResponse {
  order: AdminOrderDetailOrder
}

/**
 * The per-order money basis the seller settlement and platform revenue
 * surfaces read. `platform_commission_minor` is `null` when the order has no
 * journal basis yet, so callers must never substitute zero for it.
 */
export interface AdminOrderFinancialBreakdown {
  order_id: string
  currency: string
  platform_commission_minor: number | null
  /** `null` when the order has no paid journal basis; never substitute zero. */
  seller_payable_minor: number | null

  /** Payout availability is recorded per order when every required unit is delivered. */
  availability: {
    recorded: boolean
    available_at: string | null
  }

  /** The most recent payout attributed to this order, when one has been claimed. */
  payout: {
    id: string
    state: 'pending' | 'paid'
    amount_minor: number
    paid_at: string | null
  } | null

  /** Finance's payout destination and schedule facts for the shop. */
  payout_method: AdminOrderPayoutMethod
}

/** Finance's payout account and automatic schedule for an order's shop. */
export interface AdminOrderPayoutMethod {
  /** `missing` when the shop has no usable Payout Account. */
  account_status:
    | 'missing'
    | 'onboarding'
    | 'action_required'
    | 'active'
    | 'restricted'
    | 'disabled'
  auto_payout_enabled: boolean
  auto_payout_day_of_month: number
  /** UTC calendar date (`YYYY-MM-DD`) of the next automatic run, else `null`. */
  next_payout_date: string | null
}

export type UpdateAdminOrderStatusBody = {
  status: OrderStatuses
  cancel_reason?: string
};

export type UpdateAdminOrderRefundBody = {
  action: AdminOrderRefundAction
  reason?: string
};
