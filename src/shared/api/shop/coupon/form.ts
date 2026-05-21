import type { z } from 'zod';
import type { Coupon } from '~/shared/models/coupon';
import type { RequestGetListParams } from '~/shared/contracts/common';
import type { createPromoCodeBodySchema, createSaleBodySchema } from '~/shared/schemas/request/shop-coupon.schema';

export type CreateSaleBody = z.infer<typeof createSaleBodySchema>;
export type CreatePromoCodeBody = z.infer<typeof createPromoCodeBodySchema>;
export type GetCouponsParams = Partial<Pick<Coupon, 'code' | 'is_auto_sale'> & RequestGetListParams>;
