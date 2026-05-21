import { z } from 'zod';
import type { RequestGetListParams } from '~/shared/contracts/common';
import { createPromoCodeFormSchema } from '~/shared/schemas/forms/shop/coupon/create-promo-code-form.schema';
import { createSaleFormSchema } from '~/shared/schemas/forms/shop/coupon/create-sale-form.schema';
import { couponSchema } from '~/shared/schemas/coupon.schema';

export const shopCouponSchema = couponSchema;

export const createShopCouponRequestSchema = z.union([
  createPromoCodeFormSchema,
  createSaleFormSchema,
]);

export const createShopCouponResponseSchema = z.object({
  coupon: shopCouponSchema,
});

export const listShopCouponsRequestSchema = z.custom<Partial<RequestGetListParams & {
  code: string
  // API query params use snake_case.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  is_auto_sale: boolean
}>>();

export const listShopCouponsResponseSchema = z.object({
  results: z.array(shopCouponSchema),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
  total_results: z.number(),
});
