import { z } from 'zod'
import {
  PaymentTypes, OrderStatuses, OrderShippingStatuses, ORDER_CONFIG,
} from '@arc/enums/order'
import { idSchema } from '@arc/schemas/primitives/id.schema'
import { baseCouponSchema } from '@arc/schemas/coupon.schema'
import { baseProductSchema } from '@arc/schemas/product.schema'
import { productInventorySchema } from '@arc/schemas/product-inventory.schema'

export const orderProductSchema = z.object({
  product: baseProductSchema.shape.id,
  inventory: productInventorySchema.shape.id,
  percent_coupon: baseCouponSchema.shape.id,
  freeship_coupon: baseCouponSchema.shape.id,
  price: productInventorySchema.shape.price,
  sale_price: productInventorySchema.shape.price,
  quantity: z.number(),
  title: baseProductSchema.shape.title,
  image_url: z.string(),
})

export const orderSchema = z.object({
  id: idSchema,
  user: idSchema,
  address: idSchema,
  payment_type: z.nativeEnum(PaymentTypes),
  tracking_number: z.string(),
  stripe_charge_id: z.string(),
  currency: z.string().max(3),
  status: z.nativeEnum(OrderStatuses),
  shipping_status: z.nativeEnum(OrderShippingStatuses).default(OrderShippingStatuses.PRE_TRANSIT),
  products: z
    .array(orderProductSchema)
    .min(1),
  // .max(20),
  subtotal: z.number(),
  total_shipping_fee: z.number(),
  total_discount: z.number(),
  total: z.number(),
  note: z
    .string()
    .max(ORDER_CONFIG.MAX_CHAR_NOTE)
    .optional(),
  promo_coupons: z
    .array(baseCouponSchema.shape.id).max(ORDER_CONFIG.MAX_PROMO_COUPONS)
    .default([]),
  created_at: z.date(),
  updated_at: z.date(),
})
