import type { z } from 'zod';
import type { couponSchema, percentOffSchema } from '~/schemas/coupon.schema';
import type { RequestGetListParams } from '~/types/common';
import type { createSaleBodySchema, createPromoCodeBodySchema } from '~/schemas/request/shop-coupon.schema';

export type Coupon = z.infer<typeof couponSchema>;

export type PercentOff = z.infer<typeof percentOffSchema>;

export type CreateSaleBody = z.infer<typeof createSaleBodySchema>;

export type CreatePromoCodeBody = z.infer<typeof createPromoCodeBodySchema>;

export type GetCouponsParams = Partial<Pick<Coupon, 'code' | 'is_auto_sale'> & RequestGetListParams>;
