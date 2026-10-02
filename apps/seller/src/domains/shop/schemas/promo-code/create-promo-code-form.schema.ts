import { z } from 'zod';
import { PromotionProductScope } from '@arc/enums/promotion';
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
    if (state.product_scope === PromotionProductScope.SPECIFIC && state.product_ids.length === 0) {
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

  return {
    name: values.name.trim(),
    code: values.code.trim().toUpperCase(),
    percent_off: values.percent_off,
    visibility: values.visibility,
    product_scope: values.product_scope,
    timezone: values.timezone,
    end_local: end.local,
    end_offset_minutes: end.offsetMinutes,
    ...(values.product_scope === PromotionProductScope.SPECIFIC
      ? { product_ids: values.product_ids }
      : {}),
    ...(start
      ? { start_local: start.local, start_offset_minutes: start.offsetMinutes }
      : { start_now: true }),
  };
}
