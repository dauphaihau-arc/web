import { z } from 'zod'
import { createOrderResponseSchema } from '@arc/schemas/api/me/order/order.schema'
import { guestCheckoutAddressSchema, guestCheckoutContactSchema } from '@arc/schemas/guest-checkout.schema'

export { createOrderResponseSchema }

const guestIdentitySchema = z.object({
  email: guestCheckoutContactSchema.shape.email,
})

const shopAdjustmentSchema = z.object({
  shop_id: z.string(),
  promo_codes: z.array(z.string()).optional(),
  note: z.string().optional(),
})

export const createGuestOrderFromCartRequestSchema = z.object({
  currency: z.string().optional(),
  payment_type: z.string(),
  guest: guestIdentitySchema,
  shipping_address: guestCheckoutAddressSchema,
  addition_info_shop_carts: z.array(shopAdjustmentSchema).optional(),
})

export const createGuestOrderForBuyNowRequestSchema = z.object({
  cart_id: z.string(),
  payment_type: z.string(),
  currency: z.string().optional(),
  guest: guestIdentitySchema,
  shipping_address: guestCheckoutAddressSchema,
  promo_codes: z.array(z.string()).optional(),
  note: z.string().optional(),
})

export const getCheckoutOrderShopsBySessionResponseSchema = z.object({
  order_shops: z.array(z.object({
    shop: z.object({
      shop_name: z.string(),
      slug: z.string(),
    }),
  })),
})
