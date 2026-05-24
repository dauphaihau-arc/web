import { z } from 'zod'
import type { RequestGetListParams } from '@arc/contracts/common'
import { createPromoCodeFormSchema } from '@arc/schemas/forms/shop/coupon/create-promo-code-form.schema'
import { createSaleFormSchema } from '@arc/schemas/forms/shop/coupon/create-sale-form.schema'
import { couponSchema } from '@arc/schemas/coupon.schema'

export const shopCouponSchema = couponSchema

export const createShopCouponRequestSchema = z.union([
  createPromoCodeFormSchema,
  createSaleFormSchema,
])

export const createShopCouponResponseSchema = z.object({
  coupon: shopCouponSchema,
})

export const listShopCouponsRequestSchema = z.custom<Partial<RequestGetListParams & {
  code: string
  // API query params use snake_case.

  is_auto_sale: boolean
}>>()

export const listShopCouponsResponseSchema = z.object({
  results: z.array(shopCouponSchema),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
})
