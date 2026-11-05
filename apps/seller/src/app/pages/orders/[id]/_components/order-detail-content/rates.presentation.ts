import { ShipmentRateServices } from '@arc/enums/shipping';
import type {
  ShipmentRateQuote,
  ShipmentRateService,
  ShipmentRatesRequest,
} from '~/domains/shop/api/order/contracts/order.contract';

/**
 * The API's own ceilings for package facts. Mirroring them here keeps an
 * invalid package from being sent only to be rejected, and the wording tells
 * the seller the same limit the server enforces.
 */
export const MAX_PACKAGE_WEIGHT_GRAMS = 100_000;
export const MAX_PACKAGE_DIMENSION_CM = 300;

export type PackageField = 'weight_grams' | 'length_cm' | 'width_cm' | 'height_cm';

export type PackageFactsInput = Record<PackageField, number | string | null | undefined>;

const SERVICE_LABELS: Record<ShipmentRateService, string> = {
  [ShipmentRateServices.STANDARD]: 'Standard',
  [ShipmentRateServices.EXPRESS]: 'Express',
};

const PACKAGE_LIMITS: Record<PackageField, number> = {
  weight_grams: MAX_PACKAGE_WEIGHT_GRAMS,
  length_cm: MAX_PACKAGE_DIMENSION_CM,
  width_cm: MAX_PACKAGE_DIMENSION_CM,
  height_cm: MAX_PACKAGE_DIMENSION_CM,
};

/** `''` is how an emptied number input arrives, so it is not zero. */
function toNumber(value: number | string | null | undefined): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || value.trim() === '') return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function packageFieldError(
  field: PackageField,
  value: number | string | null | undefined,
): string | undefined {
  const parsed = toNumber(value);
  const limit = PACKAGE_LIMITS[field];
  const unit = field === 'weight_grams' ? 'grams' : 'centimetres';
  const limitLabel = field === 'weight_grams'
    ? MAX_PACKAGE_WEIGHT_GRAMS.toLocaleString('en-US')
    : String(MAX_PACKAGE_DIMENSION_CM);
  const message = `Enter a whole number of ${unit} from 1 to ${limitLabel}.`;

  if (parsed === undefined || !Number.isInteger(parsed) || parsed < 1 || parsed > limit) {
    return message;
  }

  return undefined;
}

export function packageFactsErrors(
  input: PackageFactsInput,
): Record<PackageField, string | undefined> {
  return {
    weight_grams: packageFieldError('weight_grams', input.weight_grams),
    length_cm: packageFieldError('length_cm', input.length_cm),
    width_cm: packageFieldError('width_cm', input.width_cm),
    height_cm: packageFieldError('height_cm', input.height_cm),
  };
}

/** Only called for a package the same validation accepted. */
export function packageFactsBody(input: PackageFactsInput): ShipmentRatesRequest {
  return {
    weight_grams: Number(input.weight_grams),
    length_cm: Number(input.length_cm),
    width_cm: Number(input.width_cm),
    height_cm: Number(input.height_cm),
  };
}

export function rateOptionLabel(rate: ShipmentRateQuote, carrierName: string): string {
  return `${carrierName} — ${SERVICE_LABELS[rate.service]}`;
}

export function rateEstimatedDaysLabel(rate: ShipmentRateQuote): string {
  const { min, max } = rate.estimated_days;

  if (min === max) {
    return `${min} day${min === 1 ? '' : 's'}`;
  }

  return `${min}–${max} days`;
}

export type RateTag = 'Cheapest' | 'Fastest';

/** Price first, then speed; `quote_id` keeps ties deterministic. */
function byPriceThenSpeed(left: ShipmentRateQuote, right: ShipmentRateQuote): number {
  return left.price_minor - right.price_minor
    || left.estimated_days.max - right.estimated_days.max
    || left.estimated_days.min - right.estimated_days.min
    || left.quote_id.localeCompare(right.quote_id);
}

/** Fastest delivery first, with price and then `min` breaking ties. */
function bySpeedThenPrice(left: ShipmentRateQuote, right: ShipmentRateQuote): number {
  return left.estimated_days.max - right.estimated_days.max
    || left.estimated_days.min - right.estimated_days.min
    || left.price_minor - right.price_minor
    || left.quote_id.localeCompare(right.quote_id);
}

export function sortRatesByPrice(rates: readonly ShipmentRateQuote[]): ShipmentRateQuote[] {
  return [...rates].sort(byPriceThenSpeed);
}

export function cheapestRate(
  rates: readonly ShipmentRateQuote[],
): ShipmentRateQuote | undefined {
  return [...rates].sort(byPriceThenSpeed)[0];
}

export function fastestRate(
  rates: readonly ShipmentRateQuote[],
): ShipmentRateQuote | undefined {
  return [...rates].sort(bySpeedThenPrice)[0];
}

/**
 * A freshly quoted list has no choice yet, so the seller starts on the
 * cheapest standard service — the one most buyers expect. Only when no
 * standard quote exists does the cheapest option of any service win.
 */
export function defaultRateOption(
  rates: readonly ShipmentRateQuote[],
): ShipmentRateQuote | undefined {
  const standard = rates.filter(rate => rate.service === ShipmentRateServices.STANDARD);

  return cheapestRate(standard.length > 0 ? standard : rates);
}

/** Tags are derived from the same list the seller sees, never stored. */
export function rateTagsByQuoteId(
  rates: readonly ShipmentRateQuote[],
): Record<string, RateTag[]> {
  const tags: Record<string, RateTag[]> = {};
  const cheapest = cheapestRate(rates);
  const fastest = fastestRate(rates);

  if (cheapest) tags[cheapest.quote_id] = ['Cheapest'];
  if (fastest) {
    tags[fastest.quote_id] = [...(tags[fastest.quote_id] ?? []), 'Fastest'];
  }

  return tags;
}

/** The selected quote is already the primary card, so it is never repeated. */
export function alternativeRates(
  rates: readonly ShipmentRateQuote[],
  selected: ShipmentRateQuote | undefined,
): ShipmentRateQuote[] {
  return sortRatesByPrice(
    rates.filter(rate => rate.quote_id !== selected?.quote_id),
  );
}
