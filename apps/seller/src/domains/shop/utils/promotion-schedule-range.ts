import dayjs from 'dayjs';
import {
  formatLocalDateTime,
  localDateTimeCandidates,
  parseLocalDateTime,
} from './zoned-local-date-time';

export type PromotionDurationUnit =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';

export type PromotionDurationPreset = {
  title: string
  amount: number
  unit: PromotionDurationUnit
};

/** The one-click durations offered beside the End field. */
export const PROMOTION_DURATION_PRESETS: PromotionDurationPreset[] = [
  { title: '1 hour', amount: 1, unit: 'hour' },
  { title: '24 hours', amount: 24, unit: 'hour' },
  { title: '48 hours', amount: 48, unit: 'hour' },
  { title: '7 days', amount: 7, unit: 'day' },
  { title: '30 days', amount: 30, unit: 'day' },
];

/**
 * The store's current wall clock. Everything the schedule widgets suggest
 * ("now", "in 5 days") is expressed in the Promotion's timezone, not the
 * device's, so a seller scheduling for a shop elsewhere sees the shop's clock.
 */
export function nowLocal(timeZone: string): string {
  if (!timeZone) {
    return '';
  }

  return formatLocalDateTime(new Date(), timeZone);
}

/**
 * The instant a wall clock denotes in `timeZone`; ambiguous local times resolve
 * to the earlier occurrence, the same rule the schema applies by default.
 */
export function localToInstant(local: string, timeZone: string): Date | undefined {
  if (!timeZone) {
    return undefined;
  }

  const parts = parseLocalDateTime(local);

  if (!parts) {
    return undefined;
  }

  try {
    return localDateTimeCandidates(parts, timeZone)[0];
  }
  catch {
    return undefined;
  }
}

/**
 * The wall clock `amount unit` after `baseLocal`, or after now when `baseLocal`
 * is empty or denotes no instant. The arithmetic runs on instants and the result
 * is re-read in `timeZone`, so a duration spanning a daylight-saving change
 * still lands on the correct store wall clock.
 */
export function addDurationToLocal(
  baseLocal: string,
  timeZone: string,
  amount: number,
  unit: PromotionDurationUnit,
): string {
  if (!timeZone) {
    return '';
  }

  const base = localToInstant(baseLocal, timeZone) ?? new Date();

  return formatLocalDateTime(dayjs(base).add(amount, unit).toDate(), timeZone);
}
