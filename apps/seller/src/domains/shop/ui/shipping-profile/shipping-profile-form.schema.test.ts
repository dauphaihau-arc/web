import {
  describe, expect, it,
} from 'vitest';
import { ShippingDestinationScopes, ShippingProfileStatuses } from '@arc/enums/shipping';
import { shippingProfileFormSchema } from './shipping-profile-form.schema';

function form(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Standard shipping',
    status: ShippingProfileStatuses.DRAFT,
    rates: [{
      destination_scope: ShippingDestinationScopes.EVERYWHERE_ELSE,
      one_item_fee: 5.99,
      additional_item_fee: 1.99,
    }],
    ...overrides,
  };
}

function postalIssue(postal: unknown) {
  const result = shippingProfileFormSchema.safeParse(form({ ship_from_postal: postal }));

  if (result.success) {
    return null;
  }

  return result.error.issues.find(issue => issue.path.join('.') === 'ship_from_postal')?.message ?? null;
}

describe('shipping profile form postal code', () => {
  it('accepts an absent postal code, so the field stays optional', () => {
    expect(postalIssue(undefined)).toBeNull();
  });

  it('treats a cleared box as absent rather than too short', () => {
    expect(postalIssue('')).toBeNull();
    expect(postalIssue('   ')).toBeNull();
  });

  it('accepts the postal shapes sellers actually use', () => {
    for (const postalCode of ['10001', 'SW1A 1AA', 'K1A 0B1', '12345-6789']) {
      expect(postalIssue(postalCode)).toBeNull();
    }
  });

  it('reports a postal code that is too short', () => {
    expect(postalIssue('1')).toMatch(/between 2 and 20 characters/i);
  });

  it('reports a postal code that is too long', () => {
    expect(postalIssue('1'.repeat(21))).toMatch(/between 2 and 20 characters/i);
  });

  it('reports characters no carrier would accept', () => {
    expect(postalIssue('10001@home')).toMatch(/letters, numbers, spaces, and hyphens/i);
  });
});
