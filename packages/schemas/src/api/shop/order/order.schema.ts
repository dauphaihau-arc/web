import { z } from 'zod'
import { OrderShippingStatuses, OrderStatuses, PaymentTypes } from '@arc/enums/order'

export const listShopOrdersRequestSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  status: z.array(z.nativeEnum(OrderStatuses)).optional(),
  shipping_status: z.array(z.nativeEnum(OrderShippingStatuses)).optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  amount_min: z.number().optional(),
  amount_max: z.number().optional(),
  currency: z.array(z.string()).optional(),
  payment_type: z.array(z.nativeEnum(PaymentTypes)).optional(),
  search: z.string().optional(),
})

export const shopOrderProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  image_url: z.string().optional(),
  quantity: z.number(),
  amount_minor: z.number(),
  original_amount_minor: z.number().nullable().optional(),
  currency: z.string(),
  inventory: z.object({
    variant: z.string().optional(),
  }),
  product: z.object({
    id: z.string(),
    slug: z.string(),
    shop: z.object({
      slug: z.string(),
    }),
    variant_group_name: z.string().optional(),
    variant_sub_group_name: z.string().optional(),
  }),
  percent_coupon: z.object({
    percent_off: z.number(),
  }).nullable(),
})

export const shopOrderDetailProductSchema = shopOrderProductSchema.omit({
  image_url: true,
}).extend({
  storage_key: z.string().optional(),
})

export const shopOrderTimelineEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  occurred_at: z.coerce.date(),
  actor_type: z.string(),
  actor_id: z.string().optional(),
  source: z.string().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export const shopOrderShippingSchema = z.object({
  shipping_status: z.nativeEnum(OrderShippingStatuses),
  updated_at: z.coerce.date(),
  to_country: z.string(),
  from_countries: z.array(z.string()),
  estimated_delivery: z.coerce.date(),
  tracking_number: z.string().optional(),
  shipping_carrier: z.string().optional(),
  shipment_note: z.string().optional(),
  shipped_at: z.coerce.date().optional(),
  delivered_at: z.coerce.date().optional(),
})

export const shopOrderSummarySchema = z.object({
  id: z.string(),
  order_number: z.string(),
  shop: z.object({
    id: z.string(),
    shop_name: z.string(),
    slug: z.string(),
  }),
  customer: z.object({
    email: z.string().email(),
    full_name: z.string(),
  }),
  payment: z.object({
    type: z.nativeEnum(PaymentTypes),
    refund_status: z.enum(['pending', 'succeeded', 'failed', 'not_required']).optional(),
    refunded_at: z.coerce.date().optional(),
    refund_failed_reason: z.string().optional(),
  }),
  status: z.nativeEnum(OrderStatuses),
  products: z.array(shopOrderProductSchema),
  promo_coupons: z.array(z.object({
    id: z.string(),
    code: z.string(),
  })),
  shipping: shopOrderShippingSchema,
  currency: z.string(),
  subtotal_minor: z.number(),
  shipping_minor: z.number(),
  discount_minor: z.number(),
  total_minor: z.number(),
  note: z.string().optional(),
  canceled_at: z.coerce.date().optional(),
  cancel_reason: z.string().optional(),
  customer_support_note: z.string().optional(),
  cancel_requested_at: z.coerce.date().optional(),
  created_at: z.coerce.date(),
})

export const shopOrderStatusCountsSchema = z.object({
  all: z.number(),
  awaiting_payment: z.number(),
  pending: z.number(),
  paid: z.number(),
  refunded: z.number(),
  completed: z.number(),
  canceled: z.number(),
  expired: z.number(),
  archived: z.number(),
})

export const listShopOrdersResponseSchema = z.object({
  results: z.array(shopOrderSummarySchema),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
  status_counts: shopOrderStatusCountsSchema,
})

export const shopOrderDetailResponseSchema = z.object({
  order: shopOrderSummarySchema.extend({
    products: z.array(shopOrderDetailProductSchema),
    shipping_address: z.object({
      full_name: z.string(),
      address1: z.string(),
      address2: z.string().optional(),
      city: z.string(),
      country: z.string(),
      state: z.string(),
      zip: z.string(),
      phone: z.string().optional(),
    }),
  }),
  timeline: z.array(shopOrderTimelineEventSchema),
})

export const updateShopOrderStatusRequestSchema = z.object({
  status: z.nativeEnum(OrderStatuses),
  cancel_reason: z.string().max(1000).optional(),
})

export const updateShopOrderShipmentRequestSchema = z.object({
  shipping_status: z.nativeEnum(OrderShippingStatuses).optional(),
  tracking_number: z.string().max(255).optional(),
  shipping_carrier: z.string().max(255).optional(),
  shipment_note: z.string().max(5000).optional(),
})

export const updateShopOrderRefundRequestSchema = z.object({
  action: z.enum(['request', 'retry']),
})
