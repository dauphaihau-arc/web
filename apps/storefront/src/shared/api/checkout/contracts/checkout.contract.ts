import type { z } from 'zod'
import type {
  createGuestOrderForBuyNowRequestSchema,
  createGuestOrderFromCartRequestSchema,
  createOrderResponseSchema,
  getCheckoutOrderShopsBySessionResponseSchema,
} from '@arc/schemas/api/checkout/checkout.schema'

export type CreateGuestOrderResponse = z.infer<typeof createOrderResponseSchema>
export type CreateGuestOrderFromCartRequest = z.infer<typeof createGuestOrderFromCartRequestSchema>
export type CreateGuestOrderForBuyNowRequest = z.infer<typeof createGuestOrderForBuyNowRequestSchema>
export type GetCheckoutOrderShopsBySessionResponse = z.infer<typeof getCheckoutOrderShopsBySessionResponseSchema>
