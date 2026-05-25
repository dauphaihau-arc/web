import { z } from 'zod'
import { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'

export const paymentSchema = z.object({
  type: z.string(),
  card_funding: z.string().optional(),
  card_last4: z.number().optional(),
  card_brand: z.string().optional(),
  card_exp_month: z.number().optional(),
  card_exp_year: z.number().optional(),
  refund_status: z.enum(['pending', 'succeeded', 'failed', 'not_required']).optional(),
  refunded_at: z.coerce.date().optional(),
  refund_failed_reason: z.string().optional(),
})

export const createOrderResponseSchema = z.object({
  checkout_session_url: z.string(),
  checkout_pending: z.boolean().optional(),
  order_shops: z.array(z.object({
    id: z.string(),
    shop: z.object({
      id: z.string(),
      shop_name: z.string(),
      slug: z.string(),
    }),
  })),
})

export const createOrderFromCartRequestSchema = z.object({
  currency: z.string().optional(),
  payment_type: z.string(),
  user_address_id: z.string(),
  addition_info_shop_carts: z.array(z.object({
    shop_id: z.string(),
    promo_codes: z.array(z.string()),
    note: z.string().optional(),
  })).optional(),
})

export const createOrderForBuyNowRequestSchema = z.object({
  cart_id: z.string(),
  payment_type: z.string(),
  user_address_id: z.string(),
  currency: z.string().optional(),
  note: z.string().optional(),
  promo_codes: z.array(z.string()).optional(),
})

export const orderShopProductSchema = z.object({
  product: z.object({
    id: z.string(),
    slug: z.string(),
    shop: z.object({
      slug: z.string(),
    }),
    variant_group_name: z.string().optional(),
    variant_sub_group_name: z.string().optional(),
    shipping: z.record(z.unknown()),
  }),
  inventory: z.object({
    variant: z.string().optional(),
  }),
  percent_coupon: z.object({
    percent_off: z.number(),
  }).nullable(),
  id: z.string(),
  title: z.string(),
  image_url: z.string().optional(),
  quantity: z.number(),
  price: z.number(),
  sale_price: z.number().optional(),
})

export const orderShopShippingSchema = z.object({
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

export const orderCancelRequestSchema = z.object({
  cancel_reason: z.string().max(1000).optional(),
})

export const orderSupportRequestSchema = z.object({
  support_note: z.string().min(1).max(5000),
})

export const orderShopResourceSchema = z.object({
  id: z.string(),
  shop: z.object({
    id: z.string(),
    shop_name: z.string(),
    slug: z.string(),
  }),
  payment: paymentSchema,
  status: z.nativeEnum(OrderStatuses),
  products: z.array(orderShopProductSchema),
  promo_coupons: z.array(z.object({
    id: z.string(),
    code: z.string(),
  })),
  shipping: orderShopShippingSchema,
  subtotal: z.number(),
  total_shipping_fee: z.number(),
  total_discount: z.number(),
  total: z.number(),
  note: z.string().optional(),
  canceled_at: z.coerce.date().optional(),
  cancel_reason: z.string().optional(),
  customer_support_note: z.string().optional(),
  cancel_requested_at: z.coerce.date().optional(),
  created_at: z.coerce.date(),
})

export const getOrderShopsResponseSchema = z.object({
  order_shops: z.array(orderShopResourceSchema),
})

export const myOrderDetailResponseSchema = z.object({
  order_shop: orderShopResourceSchema.extend({
    customer: z.object({
      email: z.string().email(),
    }),
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
})

export const getOrderShopsByCheckoutSessionRequestSchema = z.object({
  session_id: z.string(),
})

export const getOrderShopsByCheckoutSessionResponseSchema = z.object({
  order_shops: z.array(z.object({
    shop: z.object({
      shop_name: z.string(),
      slug: z.string(),
    }),
  })),
})
