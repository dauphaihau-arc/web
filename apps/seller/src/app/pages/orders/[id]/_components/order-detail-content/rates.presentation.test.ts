import { describe, expect, it } from 'vitest';
import {
  alternativeRates,
  cheapestRate,
  defaultRateOption,
  fastestRate,
  rateTagsByQuoteId,
  sortRatesByPrice,
} from './rates.presentation';
import type {
  ShipmentRateQuote,
  ShipmentRateService,
} from '~/domains/shop/api/order/contracts/order.contract';

function quote(input: {
  id: string
  carrier: string
  service: ShipmentRateService
  priceMinor: number
  minDays: number
  maxDays: number
}): ShipmentRateQuote {
  return {
    quote_id: input.id,
    carrier: input.carrier,
    service: input.service,
    price_minor: input.priceMinor,
    currency: 'USD',
    estimated_days: { min: input.minDays, max: input.maxDays },
    expires_at: '2026-11-02T12:15:00.000Z',
  };
}

const USPS_STANDARD = quote({
  id: 'usps_standard', carrier: 'usps', service: 'standard', priceMinor: 480, minDays: 3, maxDays: 5,
});
const USPS_EXPRESS = quote({
  id: 'usps_express', carrier: 'usps', service: 'express', priceMinor: 768, minDays: 1, maxDays: 2,
});
const DHL_STANDARD = quote({
  id: 'dhl_standard', carrier: 'dhl', service: 'standard', priceMinor: 660, minDays: 3, maxDays: 5,
});
const VNPOST_STANDARD = quote({
  id: 'vnpost_standard', carrier: 'vnpost', service: 'standard', priceMinor: 320, minDays: 3, maxDays: 5,
});
const VNPOST_EXPRESS = quote({
  id: 'vnpost_express', carrier: 'vnpost', service: 'express', priceMinor: 512, minDays: 1, maxDays: 2,
});

const RATES = [USPS_STANDARD, USPS_EXPRESS, DHL_STANDARD, VNPOST_STANDARD, VNPOST_EXPRESS];

describe('defaultRateOption', () => {
  it('picks the cheapest standard quote', () => {
    expect(defaultRateOption(RATES)).toBe(VNPOST_STANDARD);
  });

  it('ignores a cheaper express quote when a standard one exists', () => {
    const cheapExpress = quote({
      id: 'quick_express', carrier: 'dhl', service: 'express', priceMinor: 100, minDays: 1, maxDays: 1,
    });

    expect(defaultRateOption([...RATES, cheapExpress])).toBe(VNPOST_STANDARD);
  });

  it('falls back to the cheapest quote when every option is express', () => {
    expect(defaultRateOption([USPS_EXPRESS, VNPOST_EXPRESS])).toBe(VNPOST_EXPRESS);
  });

  it('returns undefined for an empty list', () => {
    expect(defaultRateOption([])).toBeUndefined();
  });
});

describe('cheapestRate and fastestRate', () => {
  it('finds the lowest price across services', () => {
    expect(cheapestRate(RATES)).toBe(VNPOST_STANDARD);
  });

  it('breaks a price tie by the shorter delivery window', () => {
    const slow = quote({
      id: 'slow', carrier: 'dhl', service: 'express', priceMinor: 320, minDays: 3, maxDays: 6,
    });
    const fast = quote({
      id: 'fast', carrier: 'usps', service: 'express', priceMinor: 320, minDays: 1, maxDays: 2,
    });

    expect(cheapestRate([slow, fast])).toBe(fast);
  });

  it('finds the earliest maximum delivery day, breaking ties by min then price', () => {
    const sameMaxCheaper = quote({
      id: 'cheaper', carrier: 'usps', service: 'express', priceMinor: 400, minDays: 1, maxDays: 2,
    });

    expect(fastestRate([...RATES, sameMaxCheaper])).toBe(sameMaxCheaper);
  });

  it('returns undefined for an empty list', () => {
    expect(cheapestRate([])).toBeUndefined();
    expect(fastestRate([])).toBeUndefined();
  });
});

describe('rateTagsByQuoteId', () => {
  it('tags the cheapest and fastest quotes', () => {
    const tags = rateTagsByQuoteId(RATES);

    expect(tags.vnpost_standard).toEqual(['Cheapest']);
    expect(tags.vnpost_express).toEqual(['Fastest']);
    expect(tags.dhl_standard).toBeUndefined();
  });

  it('lets one quote carry both tags', () => {
    const tags = rateTagsByQuoteId([VNPOST_STANDARD]);

    expect(tags.vnpost_standard).toEqual(['Cheapest', 'Fastest']);
  });

  it('returns no tags for an empty list', () => {
    expect(rateTagsByQuoteId([])).toEqual({});
  });
});

describe('sortRatesByPrice', () => {
  it('orders quotes by price ascending without mutating the input', () => {
    const input = [...RATES];
    const sorted = sortRatesByPrice(input);

    expect(sorted.map(rate => rate.quote_id)).toEqual([
      'vnpost_standard',
      'usps_standard',
      'vnpost_express',
      'dhl_standard',
      'usps_express',
    ]);
    expect(input.map(rate => rate.quote_id)).toEqual(RATES.map(rate => rate.quote_id));
  });
});

describe('alternativeRates', () => {
  it('omits the selected quote and sorts the rest by price', () => {
    const alternatives = alternativeRates(RATES, VNPOST_STANDARD);

    expect(alternatives.map(rate => rate.quote_id)).toEqual([
      'usps_standard',
      'vnpost_express',
      'dhl_standard',
      'usps_express',
    ]);
  });

  it('lists every quote when nothing is selected', () => {
    expect(alternativeRates(RATES, undefined)).toHaveLength(RATES.length);
  });
});
