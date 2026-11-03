import { describe, expect, it } from 'vitest';
import type { Carrier } from '~/domains/shop/api/carrier/contracts/carrier.contract';
import {
  carrierOptions,
  carrierTrackingError,
  carrierTrackingHint,
  carrierTrackingPlaceholder,
  findCarrier,
} from './carriers.presentation';

const USPS: Carrier = {
  code: 'usps',
  name: 'USPS',
  tracking_pattern: '^9\\d{21}$',
  tracking_hint: '22 digits starting with 9',
  observable: true,
  label_supported: true,
};

const DHL: Carrier = {
  code: 'dhl',
  name: 'DHL',
  tracking_pattern: '^\\d{10}$',
  tracking_hint: '10 digits',
  observable: true,
  label_supported: true,
};

const OTHER: Carrier = {
  code: 'other',
  name: 'Other',
  observable: false,
  label_supported: false,
};

const VNPOST: Carrier = {
  code: 'vnpost',
  name: 'VNPOST',
  tracking_pattern: '^[A-Z]{2}\\d{9}VN$',
  tracking_hint: 'two letters, nine digits, then VN',
  observable: true,
  label_supported: true,
};

const PLAIN: Carrier = {
  code: 'plain',
  name: 'Plain',
  tracking_pattern: '^\\d+$',
  observable: true,
  label_supported: false,
};

const carriers = [USPS, DHL, OTHER];

describe('carrierOptions', () => {
  it('labels every catalogue entry with its display name and keeps the code as the value', () => {
    expect(carrierOptions(carriers)).toEqual([
      { label: 'USPS', value: 'usps' },
      { label: 'DHL', value: 'dhl' },
      { label: 'Other', value: 'other' },
    ]);
  });

  it('finds a carrier by code', () => {
    expect(findCarrier(carriers, 'dhl')).toBe(DHL);
    expect(findCarrier(carriers, 'ups')).toBeUndefined();
    expect(findCarrier(carriers, undefined)).toBeUndefined();
  });
});

describe('carrierTrackingHint', () => {
  it('returns the catalogue hint as-is', () => {
    expect(carrierTrackingHint(USPS)).toBe('22 digits starting with 9');
    expect(carrierTrackingHint(DHL)).toBe('10 digits');
  });

  it('shows nothing when the carrier has no hint', () => {
    expect(carrierTrackingHint(PLAIN)).toBe('');
    expect(carrierTrackingHint(OTHER)).toBe('');
    expect(carrierTrackingHint(undefined)).toBe('');
  });
});

describe('carrierTrackingPlaceholder', () => {
  it('offers an example tracking number per carrier code', () => {
    expect(carrierTrackingPlaceholder(USPS)).toBe('9400111899223197428490');
    expect(carrierTrackingPlaceholder(DHL)).toBe('1234567890');
    expect(carrierTrackingPlaceholder(VNPOST)).toBe('EA123456789VN');
  });

  it('falls back to the local courier example for unmapped and plain carriers', () => {
    expect(carrierTrackingPlaceholder(OTHER)).toBe('Local courier tracking number');
    expect(carrierTrackingPlaceholder(PLAIN)).toBe('Local courier tracking number');
  });

  it('prompts for a carrier when none is selected', () => {
    expect(carrierTrackingPlaceholder(undefined)).toBe('Select a carrier first');
  });
});

describe('carrierTrackingError', () => {
  it('accepts a tracking number matching the observable carrier pattern', () => {
    expect(carrierTrackingError(USPS, '9400111899223456789012')).toBeUndefined();
    expect(carrierTrackingError(DHL, '1234567890')).toBeUndefined();
  });

  it('rejects a tracking number that does not match the observable carrier pattern', () => {
    expect(carrierTrackingError(USPS, '1234567890'))
      .toBe('That is not a USPS tracking number. Expected 22 digits starting with 9.');
    expect(carrierTrackingError(DHL, '9400111899223456789012'))
      .toBe('That is not a DHL tracking number. Expected 10 digits.');
  });

  it('trims whitespace before matching', () => {
    expect(carrierTrackingError(USPS, '  9400111899223456789012  ')).toBeUndefined();
  });

  it('accepts any tracking number for a non-observable carrier', () => {
    expect(carrierTrackingError(OTHER, 'anything at all')).toBeUndefined();
  });

  it('does not check a missing carrier or tracking number', () => {
    expect(carrierTrackingError(undefined, '123')).toBeUndefined();
    expect(carrierTrackingError(USPS, '')).toBeUndefined();
    expect(carrierTrackingError(USPS, '   ')).toBeUndefined();
    expect(carrierTrackingError(USPS, undefined)).toBeUndefined();
  });
});
