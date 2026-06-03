import { z } from 'zod'
import {
  checkoutQuoteResponseSchema,
  createOrderResponseSchema,
} from '@arc/schemas/api/me/order/order.schema'
import { guestCheckoutAddressSchema, guestCheckoutContactSchema } from '@arc/schemas/guest-checkout.schema'

export { createOrderResponseSchema }
export { checkoutQuoteResponseSchema }

const guestIdentitySchema = z.object({
  email: guestCheckoutContactSchema.shape.email,
})

const shopAdjustmentSchema = z.object({
  shop_id: z.string(),
  promo_codes: z.array(z.string()).optional(),
  note: z.string().optional(),
})

export const createGuestOrderFromCartRequestSchema = z.object({
  payment_type: z.string(),
  quote_id: z.string(),
  guest: guestIdentitySchema,
})

export const createGuestOrderForBuyNowRequestSchema = z.object({
  payment_type: z.string(),
  quote_id: z.string(),
  guest: guestIdentitySchema,
})

export const createGuestCheckoutQuoteFromCartRequestSchema = z.object({
  presentment_currency: z.string().optional(),
  shipping_address: guestCheckoutAddressSchema,
  addition_info_shop_carts: z.array(shopAdjustmentSchema).optional(),
})

export const createGuestCheckoutQuoteForBuyNowRequestSchema = z.object({
  cart_id: z.string(),
  presentment_currency: z.string().optional(),
  shipping_address: guestCheckoutAddressSchema,
  promo_codes: z.array(z.string()).optional(),
  note: z.string().optional(),
})

export const getCheckoutOrderShopsBySessionResponseSchema = z.object({
  order_shops: z.array(z.object({
    order_number: z.string(),
    shop: z.object({
      shop_name: z.string(),
      slug: z.string(),
    }),
  })),
})
