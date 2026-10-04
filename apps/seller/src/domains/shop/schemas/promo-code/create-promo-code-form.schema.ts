import { z } from 'zod';
import {
  PromotionBenefitType,
  PromotionMinOrderType,
  PromotionProductScope,
} from '@arc/enums/promotion';
import {
  localDateTimeCandidates,
  parseLocalDateTime,
} from '../../utils/zoned-local-date-time';
import { pickOccurrence, toSaleScheduleInstant } from '../../schemas/sale/create-sale-form.schema';
import type { CreateShopPromoCodeRequestBody } from '../../api/promo-code/contracts/promo-code.contract';

export const promoCodeVisibility = {
  PUBLIC: 'public',
  CODE_ONLY: 'code_only',
} as const;

export type PromoCodeVisibility = typeof promoCodeVisibility[keyof typeof promoCodeVisibility];

/** The two Visibility options a Promo Code can be created with. */
export const PROMO_CODE_VISIBILITY_OPTIONS = [
  { value: promoCodeVisibility.PUBLIC, label: 'Show to shoppers' },
  { value: promoCodeVisibility.CODE_ONLY, label: 'Share via promo code' },
];

/** The two Product Scopes a Promo Code can be created with. */
export const PROMO_CODE_PRODUCT_SCOPE_OPTIONS = [
  { value: PromotionProductScope.ALL, label: 'All products' },
  { value: PromotionProductScope.SPECIFIC, label: 'Select products' },
];

/** Whether the Promo Code starts immediately or at a chosen local time. */
export const PROMO_CODE_START_MODE_OPTIONS = [
  { value: 'now', label: 'Start now' },
  { value: 'scheduled', label: 'Schedule for later' },
];

/** The persisted Promo Code identity is at most 32 characters. */
export const PROMO_CODE_CODE_MAX_LENGTH = 32;

export const createPromoCodeFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter a promo code name.')
      .max(255, 'Use 255 characters or fewer.'),
    code: z
      .string()
      .trim()
      .min(1, 'Enter a promo code.')
      .max(PROMO_CODE_CODE_MAX_LENGTH, `Use ${PROMO_CODE_CODE_MAX_LENGTH} characters or fewer.`),
    percent_off: z
      .number({ invalid_type_error: 'Enter a percentage between 1 and 99.' })
      .int('Enter a whole percentage between 1 and 99.')
      .min(1, 'Enter a percentage between 1 and 99.')
      .max(99, 'Enter a percentage between 1 and 99.'),
    benefit_type: z.nativeEnum(PromotionBenefitType),
    amount_off: z
      .number({ invalid_type_error: 'Enter an amount.' })
      .finite('Enter a valid amount.'),
    min_order_type: z.nativeEnum(PromotionMinOrderType),
    min_order_value: z
      .number({ invalid_type_error: 'Enter an amount.' })
      .finite('Enter a valid amount.'),
    min_purchase_quantity: z
      .number({ invalid_type_error: 'Enter a quantity.' })
      .int('Enter a whole quantity.')
      .finite('Enter a valid quantity.'),
    // Optional redemption limits: an empty value means the dimension is
    // unlimited. A blank field is distinguishable from a deliberate `0`, and
    // both a string and a number model are accepted so a numeric input binding
    // cannot turn a blank field into an invalid value.
    max_redemptions: z.union([z.string().trim(), z.number()]),
    max_redemptions_per_buyer: z.union([z.string().trim(), z.number()]),
    visibility: z.enum(['public', 'code_only']),
    product_scope: z.nativeEnum(PromotionProductScope),
    product_ids: z.array(z.string()),
    timezone: z.string().min(1, 'Choose a timezone.'),
    start_mode: z.enum(['now', 'scheduled']),
    start_local: z.string(),
    end_local: z.string(),
    start_occurrence: z.enum(['earlier', 'later']).optional(),
    end_occurrence: z.enum(['earlier', 'later']).optional(),
  })
  .superRefine((state, context) => {
    if (state.benefit_type === PromotionBenefitType.FIXED_AMOUNT) {
      if (!(state.amount_off > 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount_off'],
          message: 'Enter an amount greater than zero.',
        });
      }
      else if (Math.round(state.amount_off * 100) !== state.amount_off * 100) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['amount_off'],
          message: 'Enter an amount with at most two decimal places.',
        });
      }
    }

    if (state.min_order_type === PromotionMinOrderType.ORDER_TOTAL) {
      if (!(state.min_order_value > 0)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['min_order_value'],
          message: 'Enter a minimum spend greater than zero.',
        });
      }
      else if (Math.round(state.min_order_value * 100) !== state.min_order_value * 100) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['min_order_value'],
          message: 'Enter an amount with at most two decimal places.',
        });
      }
    }

    if (state.min_order_type === PromotionMinOrderType.PURCHASE_QUANTITY) {
      if (!(state.min_purchase_quantity >= 1)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['min_purchase_quantity'],
          message: 'Enter a quantity of at least 1.',
        });
      }
    }

    for (const field of ['max_redemptions', 'max_redemptions_per_buyer'] as const) {
      const raw = String(state[field]);

      if (raw === '') {
        continue;
      }

      if (!/^\d+$/.test(raw) || Number(raw) < 1) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: 'Enter a whole number of at least 1, or leave blank for unlimited.',
        });
      }
    }

    if (
      state.benefit_type !== PromotionBenefitType.FREE_SHIPPING
      && state.product_scope === PromotionProductScope.SPECIFIC
      && state.product_ids.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['product_ids'],
        message: 'Add at least one product.',
      });
    }

    const timezone = state.timezone;
    const resolve = (value: string) => {
      const parts = parseLocalDateTime(value);

      if (!parts) {
        return { status: 'malformed' as const };
      }

      let candidates: Date[];

      try {
        candidates = localDateTimeCandidates(parts, timezone);
      }
      catch {
        return { status: 'malformed' as const };
      }

      if (candidates.length === 0) {
        return { status: 'nonexistent' as const };
      }

      return {
        status: (candidates.length > 1 ? 'ambiguous' : 'resolved') as 'ambiguous' | 'resolved',
        candidates,
      };
    };

    const startResolution = state.start_mode === 'scheduled'
      ? resolve(state.start_local)
      : undefined;
    const endResolution = resolve(state.end_local);

    if (startResolution?.status === 'ambiguous' && !state.start_occurrence) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_occurrence'],
        message: `That local time occurs twice in ${timezone}; choose which occurrence to use.`,
      });
    }

    if (endResolution.status === 'ambiguous' && !state.end_occurrence) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_occurrence'],
        message: `That local time occurs twice in ${timezone}; choose which occurrence to use.`,
      });
    }

    if (startResolution?.status === 'malformed') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_local'],
        message: 'Enter a start date and time.',
      });
    }

    if (startResolution?.status === 'nonexistent') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['start_local'],
        message: `That local time does not exist in ${timezone} (daylight-saving shift).`,
      });
    }

    if (endResolution.status === 'malformed') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_local'],
        message: 'Enter an end date and time.',
      });
    }

    if (endResolution.status === 'nonexistent') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_local'],
        message: `That local time does not exist in ${timezone} (daylight-saving shift).`,
      });
    }

    if (
      (startResolution?.status === 'resolved' || startResolution?.status === 'ambiguous')
      && (endResolution.status === 'resolved' || endResolution.status === 'ambiguous')
    ) {
      const startInstant = pickOccurrence(startResolution.candidates, state.start_occurrence);
      const endInstant = pickOccurrence(endResolution.candidates, state.end_occurrence);

      if (startInstant.getTime() >= endInstant.getTime()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_local'],
          message: 'The promo code must end after it starts.',
        });
      }
    }
  });

export type CreatePromoCodeFormState = z.infer<typeof createPromoCodeFormSchema>;

/** The wire schedule for one boundary: the local wall clock plus its explicit offset. */
export type PromoCodeScheduleInstant = {
  local: string
  offsetMinutes: number
};

/**
 * Turns a completed form into the request body for creating a Promo Code.
 * The schedule is resolved against the chosen timezone and sent with explicit
 * UTC offsets so the server can validate it unambiguously.
 */
export function buildCreatePromoCodePayload(
  values: CreatePromoCodeFormState,
): CreateShopPromoCodeRequestBody {
  const start = values.start_mode === 'now'
    ? undefined
    : toSaleScheduleInstant(values.start_local, values.timezone, values.start_occurrence);

  const end = toSaleScheduleInstant(values.end_local, values.timezone, values.end_occurrence);

  // Free shipping is inherently shop-wide: it waives the owning shop's
  // Shipping Charge, so it never carries a Product Scope or a benefit value.
  const productScope = values.benefit_type === PromotionBenefitType.FREE_SHIPPING
    ? PromotionProductScope.ALL
    : values.product_scope;

  const benefit: Pick<
    CreateShopPromoCodeRequestBody,
    'benefit_type' | 'percent_off' | 'amount_off'
  > = values.benefit_type === PromotionBenefitType.FIXED_AMOUNT
    ? { benefit_type: PromotionBenefitType.FIXED_AMOUNT, amount_off: values.amount_off }
    : (values.benefit_type === PromotionBenefitType.FREE_SHIPPING
      ? { benefit_type: PromotionBenefitType.FREE_SHIPPING }
      : { benefit_type: PromotionBenefitType.PERCENTAGE, percent_off: values.percent_off });

  const minimum: Pick<
    CreateShopPromoCodeRequestBody,
    'min_order_type' | 'min_order_value' | 'min_purchase_quantity'
  > = values.min_order_type === PromotionMinOrderType.ORDER_TOTAL
    ? { min_order_type: PromotionMinOrderType.ORDER_TOTAL, min_order_value: values.min_order_value }
    : (values.min_order_type === PromotionMinOrderType.PURCHASE_QUANTITY
      ? {
        min_order_type: PromotionMinOrderType.PURCHASE_QUANTITY,
        min_purchase_quantity: values.min_purchase_quantity,
      }
      : { min_order_type: PromotionMinOrderType.NONE });

  const redemptionLimits: Pick<
    CreateShopPromoCodeRequestBody,
    'max_redemptions' | 'max_redemptions_per_buyer'
  > = {
    ...(String(values.max_redemptions) === ''
      ? {}
      : { max_redemptions: Number(values.max_redemptions) }),
    ...(String(values.max_redemptions_per_buyer) === ''
      ? {}
      : { max_redemptions_per_buyer: Number(values.max_redemptions_per_buyer) }),
  };

  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    ...benefit,
    ...minimum,
    ...redemptionLimits,
    visibility: values.visibility,
    product_scope: productScope,
    timezone: values.timezone,
    end_local: end.local,
    end_offset_minutes: end.offsetMinutes,
    ...(productScope === PromotionProductScope.SPECIFIC
      ? { product_ids: values.product_ids }
      : {}),
    ...(start
      ? { start_local: start.local, start_offset_minutes: start.offsetMinutes }
      : { start_now: true }),
  };
}
