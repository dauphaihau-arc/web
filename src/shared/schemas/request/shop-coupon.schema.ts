import { z } from 'zod';
import { COUPON_TYPES } from '~/config/enums/coupon';
import {
  baseCouponSchema, conditionApplyToTypeSchema,
  conditionMinOrderTypeSchema,
  conditionTypeCouponSchema
} from '~/schemas/coupon.schema';

// region create promo code
const baseCreateCouponBodySchema = baseCouponSchema.pick({
  code: true,
  is_auto_sale: true,
  max_uses: true,
  max_uses_per_user: true,
  start_date: true,
  end_date: true,

  type: true,
  min_order_type: true,
  applies_to: true,
});

export const createPromoCodeBodySchema = baseCreateCouponBodySchema
  .and(conditionApplyToTypeSchema)
  .and(conditionMinOrderTypeSchema)
  .and(conditionTypeCouponSchema)
;

export const createSaleBodySchema = baseCreateCouponBodySchema
  .merge(z.object({
    type: z.union([z.literal(COUPON_TYPES.PERCENTAGE), z.literal(COUPON_TYPES.FREE_SHIP)]),
  }))
  .and(conditionApplyToTypeSchema)
  .and(conditionMinOrderTypeSchema)
  .and(conditionTypeCouponSchema)
;

// endregion
