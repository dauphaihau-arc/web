import { describe, expect, it } from 'vitest';
import type {
  AdministrativeArea,
  Country,
} from '~/domains/location/api/contracts/location.contract';
import { hydrateAddressCodes, toGuestAddress, toSavedAddressRequest } from './address-payload';
import type { AddressFormState } from './address-form.types';

const COUNTRIES: Country[] = [
  {
    code: 'VN',
    name: 'Vietnam',
    has_administrative_areas: true,
    postal_code_required: false,
  },
  {
    code: 'SG',
    name: 'Singapore',
    has_administrative_areas: false,
    postal_code_required: true,
  },
];

const AREAS: AdministrativeArea[] = [
  { code: 'VN-01', name: 'Hanoi' },
];

describe('saved address payload', () => {
  it('sends canonical codes instead of display names', () => {
    const payload = toSavedAddressRequest({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      city: 'Hanoi',
      country: 'Vietnam',
      country_code: 'VN',
      state: 'Hanoi',
      state_code: 'VN-01',
      zip: '100000',
      phone: '0900000000',
    });

    expect(payload).toMatchObject({
      country_code: 'VN',
      state_code: 'VN-01',
    });
    expect(payload).not.toHaveProperty('country');
    expect(payload).not.toHaveProperty('state');
    expect(payload).not.toHaveProperty('state_text');
  });

  it('sends free-text subdivision only for countries without administrative areas', () => {
    const payload = toSavedAddressRequest({
      country: 'Singapore',
      country_code: 'SG',
      state: 'Central Region',
      state_text: 'Central Region',
      state_code: undefined,
    });

    expect(payload).toMatchObject({
      country_code: 'SG',
      state_text: 'Central Region',
    });
    expect(payload).not.toHaveProperty('state_code');
    expect(payload).not.toHaveProperty('state');
  });

  it('falls back to display names for a legacy row that cannot be resolved', () => {
    const payload = toSavedAddressRequest({
      country: 'Atlantis',
      country_code: undefined,
      state: 'Old Town',
      state_code: undefined,
      state_text: undefined,
    });

    expect(payload).toMatchObject({
      country: 'Atlantis',
      state: 'Old Town',
    });
    expect(payload).not.toHaveProperty('country_code');
    expect(payload).not.toHaveProperty('state_code');
  });

  it('omits untouched location fields so the server preserves legacy rows', () => {
    const payload = toSavedAddressRequest(
      {
        full_name: 'Ada Lovelace',
        country: 'Atlantis',
        state: 'Old Town',
        state_text: 'Old Town',
      },
      { omitCountry: true, omitSubdivision: true },
    );

    expect(payload).toMatchObject({
      full_name: 'Ada Lovelace',
    });
    expect(payload).not.toHaveProperty('country');
    expect(payload).not.toHaveProperty('country_code');
    expect(payload).not.toHaveProperty('state');
    expect(payload).not.toHaveProperty('state_code');
    expect(payload).not.toHaveProperty('state_text');
  });
});

describe('guest checkout payload', () => {
  it('keeps the selected codes alongside the display names', () => {
    const guestAddress = toGuestAddress({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      city: 'Hanoi',
      country: 'Vietnam',
      country_code: 'VN',
      state: 'Hanoi',
      state_code: 'VN-01',
      state_text: undefined,
      zip: '100000',
      phone: '0900000000',
      email: 'ada@example.com',
    });

    expect(guestAddress).toEqual({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      address_2: undefined,
      city: 'Hanoi',
      country: 'Vietnam',
      country_code: 'VN',
      state: 'Hanoi',
      state_code: 'VN-01',
      state_text: undefined,
      zip: '100000',
      phone: '0900000000',
    });
    expect(guestAddress).not.toHaveProperty('email');
  });
});

describe('legacy address hydration', () => {
  it('resolves country and subdivision codes from display names', () => {
    const state: AddressFormState = {
      country: 'Vietnam',
      state: 'Hanoi',
    };

    hydrateAddressCodes(state, COUNTRIES, AREAS);

    expect(state.country_code).toBe('VN');
    expect(state.state_code).toBe('VN-01');
    expect(state.country).toBe('Vietnam');
    expect(state.state).toBe('Hanoi');
  });

  it('moves the legacy subdivision name to free text when the country has no areas', () => {
    const state: AddressFormState = {
      country: 'Singapore',
      state: 'Central Region',
    };

    hydrateAddressCodes(state, COUNTRIES, AREAS);

    expect(state.country_code).toBe('SG');
    expect(state.state_text).toBe('Central Region');
    expect(state.state_code).toBeUndefined();
  });

  it('leaves an unresolved legacy row name-based', () => {
    const state: AddressFormState = {
      country: 'Atlantis',
      state: 'Old Town',
    };

    hydrateAddressCodes(state, COUNTRIES, AREAS);

    expect(state.country_code).toBeUndefined();
    expect(state.state_code).toBeUndefined();
    expect(state.country).toBe('Atlantis');
    expect(state.state).toBe('Old Town');
  });

  it('preserves a legacy subdivision when editing an existing address', () => {
    const state: AddressFormState = {
      country: 'Vietnam',
      state: 'Hanoi',
    };

    hydrateAddressCodes(state, COUNTRIES, AREAS, {
      preserveLegacySubdivision: true,
    });

    expect(state.country_code).toBe('VN');
    expect(state.state_code).toBeUndefined();
    expect(state.state).toBe('Hanoi');
  });
});
