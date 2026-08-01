import type { z } from 'zod';
import type {
  bulkDeleteShopCouponsRequestSchema,
  bulkDeleteShopCouponsResponseSchema,
  createShopCouponRequestSchema,
  createShopCouponResponseSchema,
  listShopCouponsRequestSchema,
  listShopCouponsResponseSchema,
  shopCouponSchema
} from '~/domains/shop/api/schemas/coupon/coupon.schema';
import type { createPromoCodeFormSchema } from '~/app/pages/coupons/_schemes/coupon/create-promo-code-form.schema';
import type { createSaleFormSchema } from '~/app/pages/coupons/_schemes/coupon/create-sale-form.schema';

export type ShopCoupon = z.infer<typeof shopCouponSchema>;
export type CreatePromoCodeBody = z.infer<typeof createPromoCodeFormSchema>;
export type CreateSaleBody = z.infer<typeof createSaleFormSchema>;
export type CreateShopCouponRequest = z.infer<typeof createShopCouponRequestSchema>;
export type CreateShopCouponResponse = z.infer<typeof createShopCouponResponseSchema>;
export type ListShopCouponsRequest = z.infer<typeof listShopCouponsRequestSchema>;
export type ListShopCouponsResponse = z.infer<typeof listShopCouponsResponseSchema>;
export type DeleteShopCouponResponse = undefined;
export type BulkDeleteShopCouponsRequest = z.infer<typeof bulkDeleteShopCouponsRequestSchema>;
export type BulkDeleteShopCouponsResponse = z.infer<typeof bulkDeleteShopCouponsResponseSchema>;
