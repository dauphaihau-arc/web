import { ShippingProfileReadinessLabels, ShippingProfileStatuses } from '@arc/enums/shipping';
import type { ShippingProfileFormState } from './shipping-profile-form.schema';

/**
 * Local, pre-submit readiness for the seller editor. It mirrors the server's
 * checkout-readiness rules so a seller sees the actionable requirement before
 * saving, and in particular never mistakes a wholly absent Processing range or
 * a half-configured destination Delivery range for a zero-day estimate.
 *
 * The server remains authoritative; this only short-circuits an obviously
 * incomplete Active profile.
 */
export function collectShippingProfileFormReadinessIssues(
  form: ShippingProfileFormState,
): string[] {
  if (form.status !== ShippingProfileStatuses.ACTIVE) return [];

  const issues: string[] = [];
  if (!form.name.trim()) issues.push(ShippingProfileReadinessLabels.missing_name);
  if (form.rates.length === 0) issues.push(ShippingProfileReadinessLabels.missing_rates);

  const processingIssue = collectProcessingTimeRangeIssue(form);
  if (processingIssue === 'unset' || processingIssue === 'incomplete') {
    issues.push(ShippingProfileReadinessLabels.missing_processing_time);
  }
  else if (processingIssue === 'invalid') {
    issues.push(ShippingProfileReadinessLabels.invalid_processing_time);
  }

  const hasMissingDelivery = form.rates.some(rate => (
    (rate.delivery_time_min_days === undefined || rate.delivery_time_min_days === null)
    || (rate.delivery_time_max_days === undefined || rate.delivery_time_max_days === null)
  ));
  const hasInvertedDelivery = form.rates.some(rate => (
    rate.delivery_time_min_days !== undefined
    && rate.delivery_time_min_days !== null
    && rate.delivery_time_max_days !== undefined
    && rate.delivery_time_max_days !== null
    && rate.delivery_time_min_days > rate.delivery_time_max_days
  ));
  if (hasMissingDelivery) issues.push(ShippingProfileReadinessLabels.missing_delivery_time);
  else if (hasInvertedDelivery) issues.push(ShippingProfileReadinessLabels.invalid_delivery_time);

  return issues;
}

/**
 * The Processing range's form-level state. `unset` is a valid draft state, while
 * `incomplete` and `invalid` are not; absence stays distinct from malformation
 * so a missing range is never read as a zero-day estimate. The editor shows
 * `incomplete` and `invalid` on the field itself, and the activation checklist
 * also reports `unset`.
 */
export type ProcessingTimeRangeIssue = 'unset' | 'incomplete' | 'invalid';

export function collectProcessingTimeRangeIssue(
  form: ShippingProfileFormState,
): ProcessingTimeRangeIssue | null {
  const min = form.processing_time_min_days;
  const max = form.processing_time_max_days;
  const hasMin = min !== undefined && min !== null;
  const hasMax = max !== undefined && max !== null;

  if (!hasMin && !hasMax) {
    return 'unset';
  }

  if (hasMin !== hasMax) {
    return 'incomplete';
  }

  const isValid = Number.isInteger(min) && Number.isInteger(max) && min! >= 0 && max! >= 0 && min! <= max!;

  return isValid ? null : 'invalid';
}
