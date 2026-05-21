import type { z } from 'zod';
import type {
  createShopCouponRequestSchema,
  createShopCouponResponseSchema,
  listShopCouponsRequestSchema,
  listShopCouponsResponseSchema,
  shopCouponSchema
} from '~/shared/schemas/api/shop/coupon/coupon.schema';
import type { createPromoCodeFormSchema } from '~/shared/schemas/forms/shop/coupon/create-promo-code-form.schema';
import type { createSaleFormSchema } from '~/shared/schemas/forms/shop/coupon/create-sale-form.schema';

export type ShopCoupon = z.infer<typeof shopCouponSchema>;
export type CreatePromoCodeBody = z.infer<typeof createPromoCodeFormSchema>;
export type CreateSaleBody = z.infer<typeof createSaleFormSchema>;
export type CreateShopCouponRequest = z.infer<typeof createShopCouponRequestSchema>;
export type CreateShopCouponResponse = z.infer<typeof createShopCouponResponseSchema>;
export type ListShopCouponsRequest = z.infer<typeof listShopCouponsRequestSchema>;
export type ListShopCouponsResponse = z.infer<typeof listShopCouponsResponseSchema>;
export type DeleteShopCouponResponse = undefined;
