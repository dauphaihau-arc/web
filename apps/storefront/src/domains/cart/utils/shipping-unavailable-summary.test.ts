import { describe, expect, it } from 'vitest';
import { resolveCartShippingUnavailableKind } from './shipping-unavailable-summary';

describe('resolveCartShippingUnavailableKind', () => {
  it('keeps an all-destination cart destination-specific', () => {
    expect(resolveCartShippingUnavailableKind([
      'unsupported_destination',
      'unsupported_destination',
    ])).toBe('destination');
  });

  it('keeps an all-currency cart currency-specific', () => {
    expect(resolveCartShippingUnavailableKind([
      'unsupported_currency',
    ])).toBe('currency');
  });

  it('uses the generic notice for internal reasons', () => {
    expect(resolveCartShippingUnavailableKind([
      'missing_assignment',
      'profile_not_found',
    ])).toBe('unavailable');
  });

  it('uses the generic notice for mixed reasons', () => {
    expect(resolveCartShippingUnavailableKind([
      'unsupported_destination',
      'unsupported_currency',
    ])).toBe('unavailable');
  });

  it('uses the generic notice when no line reason is present', () => {
    expect(resolveCartShippingUnavailableKind([])).toBe('unavailable');
  });
});
