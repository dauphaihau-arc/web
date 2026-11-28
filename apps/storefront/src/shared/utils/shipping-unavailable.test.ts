import { describe, expect, it } from 'vitest';
import { resolveShippingUnavailableKind } from './shipping-unavailable';

describe('resolveShippingUnavailableKind', () => {
  it('keeps a destination failure actionable', () => {
    expect(resolveShippingUnavailableKind('unsupported_destination')).toBe('destination');
  });

  it('keeps a currency failure distinct', () => {
    expect(resolveShippingUnavailableKind('unsupported_currency')).toBe('currency');
  });

  it.each([
    'missing_assignment',
    'profile_not_found',
    'profile_not_ready',
    'unexpected_reason',
    undefined,
  ])('collapses an internal or unknown reason to unavailable: %s', (reason) => {
    expect(resolveShippingUnavailableKind(reason)).toBe('unavailable');
  });
});
