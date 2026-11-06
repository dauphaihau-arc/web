import { describe, expect, it } from 'vitest';
import { ADDRESS_CONFIG } from '@arc/enums/address';
import type { GetCountryAddressRulesResponse } from '~/domains/location/api/contracts/location.contract';
import {
  type AddressFieldKey,
  fallbackAddressFieldRules,
  toAddressFieldRules,
} from './address-field-rules';

/** US rules exactly as `GET /locations/countries/US/address-rules` returns them. */
const US_RESPONSE: GetCountryAddressRulesResponse = {
  country_code: 'US',
  fields: [
    {
      key: 'full_name', label: 'Full Name', visible: true, required: true, control: 'text', autocomplete: 'name',
    },
    {
      key: 'address_1', label: 'Street', visible: true, required: true, control: 'text', autocomplete: 'address-line1',
    },
    {
      key: 'address_2', label: 'Apt / Suite / Other', visible: true, required: false, control: 'text', autocomplete: 'address-line2',
    },
    {
      key: 'city', label: 'City', visible: true, required: true, control: 'text', autocomplete: 'address-level2',
    },
    {
      key: 'subdivision', label: 'State', visible: true, required: true, control: 'select', autocomplete: 'address-level1',
    },
    {
      key: 'zip', label: 'ZIP code', visible: true, required: true, control: 'text', autocomplete: 'postal-code',
    },
    {
      key: 'phone', label: 'Phone', visible: true, required: true, control: 'tel', autocomplete: 'tel',
    },
  ],
};

/** GB hides the subdivision, JP reorders fields, HK hides the postcode. */
const COUNTRY_RESPONSES: Record<string, GetCountryAddressRulesResponse> = {
  GB: {
    country_code: 'GB',
    fields: [
      {
        key: 'full_name', label: 'Full Name', visible: true, required: true, control: 'text', autocomplete: 'name',
      },
      {
        key: 'address_1', label: 'Street', visible: true, required: true, control: 'text', autocomplete: 'address-line1',
      },
      {
        key: 'address_2', label: 'Apt / Suite / Other', visible: true, required: false, control: 'text', autocomplete: 'address-line2',
      },
      {
        key: 'city', label: 'City', visible: true, required: true, control: 'text', autocomplete: 'address-level2',
      },
      {
        key: 'subdivision', label: 'State/Province', visible: false, required: false, control: 'text', autocomplete: 'address-level1',
      },
      {
        key: 'zip', label: 'Postcode', visible: true, required: true, control: 'text', autocomplete: 'postal-code',
      },
      {
        key: 'phone', label: 'Phone', visible: true, required: true, control: 'tel', autocomplete: 'tel',
      },
    ],
  },
  JP: {
    country_code: 'JP',
    fields: [
      {
        key: 'zip', label: 'Postal code', visible: true, required: true, control: 'text', autocomplete: 'postal-code',
      },
      {
        key: 'subdivision', label: 'Prefecture', visible: true, required: true, control: 'select', autocomplete: 'address-level1',
      },
      {
        key: 'address_1', label: 'Street', visible: true, required: true, control: 'text', autocomplete: 'address-line1',
      },
      {
        key: 'address_2', label: 'Apt / Suite / Other', visible: true, required: false, control: 'text', autocomplete: 'address-line2',
      },
      {
        key: 'full_name', label: 'Full Name', visible: true, required: true, control: 'text', autocomplete: 'name',
      },
      {
        key: 'city', label: 'City', visible: true, required: true, control: 'text', autocomplete: 'address-level2',
      },
      {
        key: 'phone', label: 'Phone', visible: true, required: true, control: 'tel', autocomplete: 'tel',
      },
    ],
  },
  HK: {
    country_code: 'HK',
    fields: [
      {
        key: 'full_name', label: 'Full Name', visible: true, required: true, control: 'text', autocomplete: 'name',
      },
      {
        key: 'address_1', label: 'Street', visible: true, required: true, control: 'text', autocomplete: 'address-line1',
      },
      {
        key: 'address_2', label: 'Apt / Suite / Other', visible: true, required: false, control: 'text', autocomplete: 'address-line2',
      },
      {
        key: 'city', label: 'City', visible: true, required: true, control: 'text', autocomplete: 'address-level2',
      },
      {
        key: 'subdivision', label: 'District', visible: true, required: false, control: 'text', autocomplete: 'address-level1',
      },
      {
        key: 'zip', label: 'Zip/Postal code', visible: false, required: false, control: 'text', autocomplete: 'postal-code',
      },
      {
        key: 'phone', label: 'Phone', visible: true, required: true, control: 'tel', autocomplete: 'tel',
      },
    ],
  },
};

describe('toAddressFieldRules', () => {
  it('maps the API response onto the form rules unchanged except the lengths', () => {
    const rules = toAddressFieldRules(US_RESPONSE);

    expect(rules.map(rule => rule.key)).toEqual([
      'full_name',
      'address_1',
      'address_2',
      'city',
      'subdivision',
      'zip',
      'phone',
    ]);

    expect(rules.map(rule => ({
      key: rule.key,
      label: rule.label,
      visible: rule.visible,
      required: rule.required,
      control: rule.control,
      autocomplete: rule.autocomplete,
    }))).toEqual(US_RESPONSE.fields);

    expect(rules.map(rule => rule.maxLength)).toEqual([
      ADDRESS_CONFIG.MAX_CHAR_FULL_NAME,
      ADDRESS_CONFIG.MAX_CHAR_ADDRESS,
      ADDRESS_CONFIG.MAX_CHAR_ADDRESS,
      ADDRESS_CONFIG.MAX_CHAR_CITY,
      ADDRESS_CONFIG.MAX_CHAR_CITY,
      ADDRESS_CONFIG.MAX_CHAR_ZIP,
      ADDRESS_CONFIG.MAX_CHAR_PHONE,
    ]);
  });

  it('keeps the server order, labels, and visibility per country', () => {
    expect(toAddressFieldRules(COUNTRY_RESPONSES.GB).map(rule => rule.key))
      .toEqual(['full_name', 'address_1', 'address_2', 'city', 'subdivision', 'zip', 'phone']);
    expect(toAddressFieldRules(COUNTRY_RESPONSES.GB).find(rule => rule.key === 'subdivision'))
      .toMatchObject({ label: 'State/Province', visible: false, required: false });
    expect(toAddressFieldRules(COUNTRY_RESPONSES.GB).find(rule => rule.key === 'zip'))
      .toMatchObject({ label: 'Postcode', required: true });

    expect(toAddressFieldRules(COUNTRY_RESPONSES.JP).map(rule => rule.key))
      .toEqual(['zip', 'subdivision', 'address_1', 'address_2', 'full_name', 'city', 'phone']);
    expect(toAddressFieldRules(COUNTRY_RESPONSES.JP).find(rule => rule.key === 'subdivision'))
      .toMatchObject({
        label: 'Prefecture', visible: true, required: true, control: 'select',
      });

    expect(toAddressFieldRules(COUNTRY_RESPONSES.HK).find(rule => rule.key === 'zip'))
      .toMatchObject({ visible: false, required: false });
    expect(toAddressFieldRules(COUNTRY_RESPONSES.HK).find(rule => rule.key === 'subdivision'))
      .toMatchObject({ label: 'District', visible: true });
  });

  it('appends a required email only for guest addresses', () => {
    const guestRules = toAddressFieldRules(US_RESPONSE, { guest: true });

    expect(guestRules.map(rule => rule.key).at(-1)).toBe('email');
    expect(guestRules.at(-1)).toEqual({
      key: 'email',
      label: 'Email',
      visible: true,
      required: true,
      control: 'email',
      autocomplete: 'email',
      maxLength: 320,
    });
    expect(toAddressFieldRules(US_RESPONSE).some(rule => rule.key === 'email')).toBe(false);
  });

  it('falls back to the legacy order and labels when the response is missing', () => {
    const expectedOrder: AddressFieldKey[] = [
      'full_name',
      'address_1',
      'address_2',
      'city',
      'subdivision',
      'zip',
      'phone',
    ];

    const fallback = fallbackAddressFieldRules();
    expect(fallback.map(rule => rule.key)).toEqual(expectedOrder);
    expect(fallback.map(rule => rule.label)).toEqual([
      'Full Name',
      'Street',
      'Apt / Suite / Other',
      'City',
      'State/Province',
      'Zip/Postal code',
      'Phone',
    ]);
    expect(fallback.find(rule => rule.key === 'subdivision'))
      .toMatchObject({ visible: true, required: false, control: 'text' });
    expect(fallback.find(rule => rule.key === 'zip'))
      .toMatchObject({ visible: true, required: false, control: 'text' });
    expect(fallback.map(rule => rule.maxLength)).toEqual([
      ADDRESS_CONFIG.MAX_CHAR_FULL_NAME,
      ADDRESS_CONFIG.MAX_CHAR_ADDRESS,
      ADDRESS_CONFIG.MAX_CHAR_ADDRESS,
      ADDRESS_CONFIG.MAX_CHAR_CITY,
      ADDRESS_CONFIG.MAX_CHAR_CITY,
      ADDRESS_CONFIG.MAX_CHAR_ZIP,
      ADDRESS_CONFIG.MAX_CHAR_PHONE,
    ]);

    expect(toAddressFieldRules(undefined)).toEqual(fallback);
    expect(toAddressFieldRules(undefined, { guest: true }).map(rule => rule.key).at(-1)).toBe('email');
    expect(fallbackAddressFieldRules({ guest: true }).at(-1)).toMatchObject({
      key: 'email', required: true, maxLength: 320,
    });
  });
});
