import { describe, expect, it } from 'vitest';
import {
  resolveShippingPreviewKind,
  resolveShippingUnavailableKind,
} from './shipping-unavailable';

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

describe('resolveShippingPreviewKind', () => {
  it('returns the buyer-actionable kind for an unavailable preview', () => {
    expect(resolveShippingPreviewKind({
      available: false,
      is_digital: false,
      reason: 'unsupported_destination',
    })).toBe('destination');
  });

  it('returns no recovery kind for available or digital previews', () => {
    expect(resolveShippingPreviewKind({
      available: true,
      is_digital: false,
    })).toBeNull();
    expect(resolveShippingPreviewKind({
      available: false,
      is_digital: true,
      reason: 'missing_assignment',
    })).toBeNull();
  });

  it('returns no recovery kind when the preview is absent', () => {
    expect(resolveShippingPreviewKind(undefined)).toBeNull();
  });
});
