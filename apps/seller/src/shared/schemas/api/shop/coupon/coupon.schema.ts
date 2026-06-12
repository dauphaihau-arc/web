import { z } from 'zod'
import type { RequestGetListParams } from '@arc/contracts/common'
import { couponSchema } from '@arc/schemas/coupon.schema'
import { createPromoCodeFormSchema } from '~/shared/schemas/forms/shop/coupon/create-promo-code-form.schema'
import { createSaleFormSchema } from '~/shared/schemas/forms/shop/coupon/create-sale-form.schema'

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
}> & Partial<Record<'is_auto_sale', boolean> & Record<'active_from' | 'active_to', string>>>()

export const listShopCouponsResponseSchema = z.object({
  results: z.array(shopCouponSchema),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
  type_counts: z.object({
    all: z.number(),
    promo_code: z.number(),
    sale: z.number(),
  }),
})

export const bulkDeleteShopCouponsRequestSchema = z.object({
  ids: z.array(z.string()).min(1),
})

export const bulkDeleteShopCouponsResponseSchema = z.object({
  succeeded_ids: z.array(z.string()),
  failed: z.array(z.object({
    id: z.string(),
    code: z.string(),
    reason: z.string(),
  })),
})
