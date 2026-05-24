import { z } from 'zod';
import { CouponTypes } from '~/shared/config/enums/coupon';
import {
  baseCouponSchema, conditionApplyToTypeSchema, conditionMinOrderTypeSchema, conditionTypeCouponSchema
} from '~/shared/schemas/coupon.schema';

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

export const createSaleFormSchema = baseCreateCouponBodySchema
  .merge(z.object({
    type: z.union([z.literal(CouponTypes.PERCENTAGE), z.literal(CouponTypes.FREE_SHIP)]),
  }))
  .and(conditionApplyToTypeSchema)
  .and(conditionMinOrderTypeSchema)
  .and(conditionTypeCouponSchema);
