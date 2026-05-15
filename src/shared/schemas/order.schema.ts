import { z } from 'zod';
import {
  PAYMENT_TYPES, ORDER_STATUSES, ORDER_SHIPPING_STATUSES, ORDER_CONFIG
} from '~/config/enums/order';
import { objectIdSchema } from '~/schemas/sub/objectId.schema';
import { baseCouponSchema } from '~/schemas/coupon.schema';
import { baseProductSchema } from '~/schemas/product.schema';
import { productInventorySchema } from '~/schemas/product-inventory.schema';

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
});

export const orderSchema = z.object({
  id: objectIdSchema,
  user: objectIdSchema,
  address: objectIdSchema,
  payment_type: z.nativeEnum(PAYMENT_TYPES),
  tracking_number: z.string(),
  stripe_charge_id: z.string(),
  currency: z.string().max(3),
  status: z.nativeEnum(ORDER_STATUSES),
  shipping_status: z.nativeEnum(ORDER_SHIPPING_STATUSES).default(ORDER_SHIPPING_STATUSES.PRE_TRANSIT),
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
});
