import { z } from 'zod';
import { PromotionProductScope } from '@arc/enums/promotion';
import {
  localDateTimeCandidates,
  offsetMinutesForInstant,
  parseLocalDateTime,
  type LocalDateTimeParts,
} from '../../utils/zoned-local-date-time';

export const createSaleFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter a sale name.')
      .max(255, 'Use 255 characters or fewer.'),
    percent_off: z
      .number({ invalid_type_error: 'Enter a percentage between 1 and 99.' })
      .int('Enter a whole percentage between 1 and 99.')
      .min(1, 'Enter a percentage between 1 and 99.')
      .max(99, 'Enter a percentage between 1 and 99.'),
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
          message: 'The sale must end after it starts.',
        });
      }
    }
  });

export type CreateSaleFormState = z.infer<typeof createSaleFormSchema>;

export type SaleScheduleInstant = {
  local: string
  offsetMinutes: number
};

/**
 * Picks the instant matching the seller's chosen occurrence. An undefined
 * occurrence only happens while the form is still being validated; the format
 * layer never receives one, because a repeated local time requires a choice.
 */
export function pickOccurrence(
  candidates: Date[],
  occurrence: 'earlier' | 'later' | undefined,
): Date {
  return occurrence === 'later' ? candidates[candidates.length - 1]! : candidates[0]!;
}

export function isAmbiguousLocalTime(parts: LocalDateTimeParts, timezone: string): boolean {
  return localDateTimeCandidates(parts, timezone).length > 1;
}

/** The wire schedule for one boundary: the local wall clock plus its explicit offset. */
export function toSaleScheduleInstant(
  local: string,
  timezone: string,
  occurrence: 'earlier' | 'later' | undefined,
): SaleScheduleInstant {
  const parts = parseLocalDateTime(local);

  if (!parts) {
    throw new Error(`Malformed local date time: ${local}`);
  }

  const candidates = localDateTimeCandidates(parts, timezone);
  const instant = pickOccurrence(candidates, occurrence);

  return { local, offsetMinutes: offsetMinutesForInstant(instant, timezone) };
}
