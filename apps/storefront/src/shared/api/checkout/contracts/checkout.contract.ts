import type { z } from 'zod'
import type {
  checkoutQuoteResponseSchema,
  createGuestCheckoutQuoteForBuyNowRequestSchema,
  createGuestCheckoutQuoteFromCartRequestSchema,
  createGuestOrderForBuyNowRequestSchema,
  createGuestOrderFromCartRequestSchema,
  createOrderResponseSchema,
  getCheckoutOrderShopsBySessionResponseSchema,
} from '@arc/schemas/api/checkout/checkout.schema'

export type CreateGuestOrderResponse = z.infer<typeof createOrderResponseSchema>
export type CheckoutQuoteResponse = z.infer<typeof checkoutQuoteResponseSchema>
export type CreateGuestCheckoutQuoteFromCartRequest = z.infer<typeof createGuestCheckoutQuoteFromCartRequestSchema>
export type CreateGuestCheckoutQuoteForBuyNowRequest = z.infer<typeof createGuestCheckoutQuoteForBuyNowRequestSchema>
export type CreateGuestOrderFromCartRequest = z.infer<typeof createGuestOrderFromCartRequestSchema>
export type CreateGuestOrderForBuyNowRequest = z.infer<typeof createGuestOrderForBuyNowRequestSchema>
export type GetCheckoutOrderShopsBySessionResponse = z.infer<typeof getCheckoutOrderShopsBySessionResponseSchema>
