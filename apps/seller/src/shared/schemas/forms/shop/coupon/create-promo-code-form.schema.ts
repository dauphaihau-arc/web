import {
  baseCouponSchema, conditionApplyToTypeSchema, conditionMinOrderTypeSchema, conditionTypeCouponSchema
} from '@arc/schemas/coupon.schema';

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

export const createPromoCodeFormSchema = baseCreateCouponBodySchema
  .and(conditionApplyToTypeSchema)
  .and(conditionMinOrderTypeSchema)
  .and(conditionTypeCouponSchema);
