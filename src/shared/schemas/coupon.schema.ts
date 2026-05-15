import { z } from 'zod';
import { PRODUCT_CONFIG } from '~/config/enums/product';
import {
  COUPON_APPLIES_TO,
  COUPON_TYPES,
  COUPON_MIN_ORDER_TYPES,
  COUPON_CONFIG
} from '~/config/enums/coupon';
import { objectIdSchema } from '~/schemas/sub/objectId.schema';

export const baseCouponSchema = z.object({
  id: objectIdSchema,
  shop: objectIdSchema,
  code: z
    .string()
    .min(COUPON_CONFIG.MIN_CHAR_CODE,
      `Please enter a characters between
       ${COUPON_CONFIG.MIN_CHAR_CODE} and ${COUPON_CONFIG.MAX_CHAR_CODE}.`)
    .max(COUPON_CONFIG.MAX_CHAR_CODE,
      `Please enter a characters between
       ${COUPON_CONFIG.MIN_CHAR_CODE} and ${COUPON_CONFIG.MAX_CHAR_CODE}.`),
  type: z
    .nativeEnum(COUPON_TYPES)
    .default(COUPON_TYPES.FIXED_AMOUNT),
  applies_to: z
    .nativeEnum(COUPON_APPLIES_TO)
    .default(COUPON_APPLIES_TO.ALL),
  max_uses_per_user: z
    .number()
    .min(COUPON_CONFIG.MIN_USES_PER_USER,
      `Please enter a value between
       ${COUPON_CONFIG.MIN_USES_PER_USER} and ${COUPON_CONFIG.MAX_USES_PER_USER}.`)
    .max(COUPON_CONFIG.MAX_USES_PER_USER,
      `Please enter a value between
       ${COUPON_CONFIG.MIN_USES_PER_USER} and ${COUPON_CONFIG.MAX_USES_PER_USER}.`),
  max_uses: z
    .number()
    .min(1, `Please enter a value between 1 and ${PRODUCT_CONFIG.MAX_STOCK}.`)
    .max(COUPON_CONFIG.MAX_USES,
      `Please enter a value between 1 and ${COUPON_CONFIG.MAX_USES}.`),
  min_order_type: z
    .nativeEnum(COUPON_MIN_ORDER_TYPES)
    .default(COUPON_MIN_ORDER_TYPES.ORDER_TOTAL),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  uses_count: z
    .number()
    .default(0),
  is_active: z
    .boolean()
    .default(false),
  users_used: z
    .array(objectIdSchema)
    .optional(),
  is_auto_sale: z
    .boolean()
    .default(false)
    .optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const percentOffSchema = z.object({
  type: z.literal(COUPON_TYPES.PERCENTAGE),
  percent_off: z
    .number()
    .min(1, 'Please enter a value between 1 and 99.')
    .max(99, 'Please enter a value between 1 and 99.'),
});

export const fixAmountSchema = z.object({
  type: z.literal(COUPON_TYPES.FIXED_AMOUNT),
  amount_off: z
    .number()
    .min(1, `Please enter a value between 1 and ${PRODUCT_CONFIG.MAX_PRICE - 1}.`)
    .max(PRODUCT_CONFIG.MAX_PRICE - 1,
      `Please enter a value between 1 and ${PRODUCT_CONFIG.MAX_PRICE - 1}.`),
});

export const minProductSchema = z.object({
  min_order_type: z.literal(COUPON_MIN_ORDER_TYPES.NUMBER_OF_PRODUCTS),
  min_products: z
    .number()
    .min(1),
});

export const minOrderValueSchema = z.object({
  min_order_type: z.literal(COUPON_MIN_ORDER_TYPES.ORDER_TOTAL),
  min_order_value: z
    .number()
    .min(1),
});

export const applyToSpecifySchema = z.object({
  applies_to: z.literal(COUPON_APPLIES_TO.SPECIFIC),
  applies_product_ids: z
    .array(objectIdSchema)
    .min(1, 'Add at least 1 product')
    .default([]),
});

export const conditionApplyToTypeSchema = z.discriminatedUnion(
  'applies_to', [
    z.object({ applies_to: z.literal(COUPON_APPLIES_TO.ALL) }),
    applyToSpecifySchema,
  ]
);

export const conditionMinOrderTypeSchema = z.discriminatedUnion(
  'min_order_type', [
    z.object({ min_order_type: z.literal(COUPON_MIN_ORDER_TYPES.NONE) }),
    minProductSchema,
    minOrderValueSchema,
  ]
);

export const conditionTypeCouponSchema = z.discriminatedUnion(
  'type', [
    z.object({ type: z.literal(COUPON_TYPES.FREE_SHIP) }),
    percentOffSchema,
    fixAmountSchema,
  ]
);

export const couponSchema = baseCouponSchema
  .and(conditionApplyToTypeSchema)
  .and(conditionMinOrderTypeSchema)
  .and(conditionTypeCouponSchema);
