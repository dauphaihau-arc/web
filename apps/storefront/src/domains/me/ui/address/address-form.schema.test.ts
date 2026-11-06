import type { SafeParseReturnType } from 'zod';
import { describe, expect, it } from 'vitest';
import { createCodedAddressFormSchema, createGuestAddressFormSchema } from './address-form.schema';
import { PHONE_INVALID, POSTCODE_INVALID, POSTCODE_REQUIRED } from './address-validation';

const REQUIRED_FIELDS = {
  full_name: 'Ada Lovelace',
  address_1: '1 Analytical Engine Way',
  city: 'Test City',
  zip: '00000',
  phone: '4155552671',
};

const US_FIELDS = {
  ...REQUIRED_FIELDS,
  country_code: 'US',
  state_code: 'US-CA',
};

const GUEST_FIELDS = {
  full_name: 'Ada Lovelace',
  address_1: '1 Analytical Engine Way',
  city: 'London',
  country_code: 'GB',
  email: 'ada@example.com',
  phone: '020 7946 0958',
  zip: 'sw1a 1aa',
};

function issuesFor(result: SafeParseReturnType<unknown, unknown>) {
  return result.success ? [] : result.error.issues;
}

describe('coded address form schema', () => {
  it('requires a country code and subdivision for a country with administrative areas', () => {
    const schema = createCodedAddressFormSchema(true);

    expect(schema.safeParse(REQUIRED_FIELDS).success).toBe(false);
    expect(schema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'US',
    }).success).toBe(false);
    expect(schema.safeParse(US_FIELDS).success).toBe(true);
  });

  it('allows an untouched legacy country and subdivision while editing', () => {
    const schema = createCodedAddressFormSchema(true, {
      allowLegacyCountry: true,
      allowLegacySubdivision: true,
    });

    expect(schema.safeParse({
      ...REQUIRED_FIELDS,
      country: 'Narnia',
      state: 'Nowhere',
      state_text: 'Nowhere',
    }).success).toBe(true);
  });

  it('still requires a subdivision once the buyer chooses from the list', () => {
    const schema = createCodedAddressFormSchema(true, {
      allowLegacyCountry: true,
    });

    expect(schema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'US',
      state: 'Atlantis',
    }).success).toBe(false);
  });

  it('accepts and normalizes alphanumeric postcodes such as GB and CA entries', () => {
    const gbSchema = createCodedAddressFormSchema(false, {
      countryCode: 'GB',
      postalCodeRequired: true,
    });
    const gbResult = gbSchema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'GB',
      phone: '020 7946 0958',
      zip: ' sw1a  1aa ',
    });

    expect(gbResult.success).toBe(true);
    if (gbResult.success) {
      expect(gbResult.data.zip).toBe('SW1A 1AA');
    }

    const caSchema = createCodedAddressFormSchema(false, {
      countryCode: 'CA',
      postalCodeRequired: true,
    });

    expect(caSchema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'CA',
      phone: '6135550123',
      zip: 'k1a 0b1',
    }).success).toBe(true);

    const invalid = caSchema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'CA',
      phone: '6135550123',
      zip: '1234567',
    });

    expect(invalid.success).toBe(false);
    expect(issuesFor(invalid)).toContainEqual(expect.objectContaining({
      path: ['zip'],
      message: POSTCODE_INVALID,
    }));
  });

  it('accepts an empty postcode only where the country marks it optional', () => {
    const optionalSchema = createCodedAddressFormSchema(true, {
      countryCode: 'VN',
      postalCodeRequired: false,
    });
    const optionalResult = optionalSchema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'VN',
      state_code: 'VN-01',
      phone: '0912345678',
      zip: undefined,
    });

    expect(optionalResult.success).toBe(true);
    if (optionalResult.success) {
      expect(optionalResult.data.zip).toBe('');
    }

    const requiredSchema = createCodedAddressFormSchema(true, {
      countryCode: 'US',
      postalCodeRequired: true,
    });
    const requiredResult = requiredSchema.safeParse({
      ...US_FIELDS,
      zip: '',
    });

    expect(requiredResult.success).toBe(false);
    expect(issuesFor(requiredResult)).toContainEqual(expect.objectContaining({
      path: ['zip'],
      message: POSTCODE_REQUIRED,
    }));
  });

  it('validates the phone against the selected country', () => {
    const schema = createCodedAddressFormSchema(true, {
      countryCode: 'US',
      postalCodeRequired: true,
    });

    const invalid = schema.safeParse({
      ...US_FIELDS,
      phone: '0900000000',
    });

    expect(invalid.success).toBe(false);
    expect(issuesFor(invalid)).toContainEqual(expect.objectContaining({
      path: ['phone'],
      message: PHONE_INVALID,
    }));

    expect(schema.safeParse({
      ...US_FIELDS,
      phone: '+1 415 555 2671',
    }).success).toBe(true);
  });

  it('keeps unchanged legacy phone and postcode while allowing an unrelated edit', () => {
    const schema = createCodedAddressFormSchema(true, {
      countryCode: 'US',
      postalCodeRequired: true,
      preservePhone: '0900000000',
      preserveZip: 'ABCDE',
    });

    expect(schema.safeParse({
      ...US_FIELDS,
      city: 'New City',
      phone: '0900000000',
      zip: 'ABCDE',
    }).success).toBe(true);
  });

  it('validates a changed phone or postcode even when the stored value was preserved', () => {
    const schema = createCodedAddressFormSchema(true, {
      countryCode: 'US',
      postalCodeRequired: true,
      preservePhone: '0900000000',
      preserveZip: 'ABCDE',
    });

    expect(schema.safeParse({
      ...US_FIELDS,
      phone: '0900000001',
      zip: 'ABCDE',
    }).success).toBe(false);

    const changedPostcode = schema.safeParse({
      ...US_FIELDS,
      phone: '0900000000',
      zip: 'ABCDE2',
    });

    expect(changedPostcode.success).toBe(false);
    expect(issuesFor(changedPostcode)).toContainEqual(expect.objectContaining({
      path: ['zip'],
      message: POSTCODE_INVALID,
    }));
  });
  it('skips postcode validation and serializes an empty value when the field is hidden', () => {
    const schema = createCodedAddressFormSchema(false, {
      countryCode: 'GB',
      postcodeVisible: false,
      postalCodeRequired: true,
    });
    const result = schema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'GB',
      phone: '020 7946 0958',
      zip: 'not-a-postcode',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.zip).toBe('');
    }
  });

  it('does not require a subdivision when the field is hidden', () => {
    const schema = createCodedAddressFormSchema(true, {
      countryCode: 'US',
      postalCodeRequired: true,
      subdivisionVisible: false,
    });
    const withoutSubdivision = { ...US_FIELDS, state_code: undefined };

    expect(schema.safeParse(withoutSubdivision).success).toBe(true);
  });
});

describe('guest address form schema', () => {
  it('applies hidden-field visibility to the guest schema', () => {
    const schema = createGuestAddressFormSchema(true, {
      countryCode: 'US',
      postalCodeRequired: true,
      postcodeVisible: false,
      subdivisionVisible: false,
    });

    expect(schema.safeParse({
      ...GUEST_FIELDS,
      country_code: 'US',
      phone: '4155552671',
      state: undefined,
      zip: undefined,
    }).success).toBe(true);
  });

  it('applies the same phone and postcode rules as the saved address form', () => {
    const schema = createGuestAddressFormSchema(false, {
      countryCode: 'GB',
      postalCodeRequired: true,
    });
    const result = schema.safeParse(GUEST_FIELDS);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.zip).toBe('SW1A 1AA');
    }

    const invalid = schema.safeParse({
      ...GUEST_FIELDS,
      phone: '12345',
      zip: '1234567',
    });

    expect(invalid.success).toBe(false);
    const issues = issuesFor(invalid);
    expect(issues).toContainEqual(expect.objectContaining({ path: ['phone'], message: PHONE_INVALID }));
    expect(issues).toContainEqual(expect.objectContaining({ path: ['zip'], message: POSTCODE_INVALID }));
  });

  it('accepts an empty postcode for a guest country that does not require one', () => {
    const schema = createGuestAddressFormSchema(true, {
      countryCode: 'VN',
      postalCodeRequired: false,
    });

    expect(schema.safeParse({
      ...GUEST_FIELDS,
      country_code: 'VN',
      phone: '0912345678',
      state_code: 'VN-01',
      zip: undefined,
    }).success).toBe(true);
  });

  it('requires a country code instead of accepting a display name', () => {
    const schema = createGuestAddressFormSchema(false, {
      countryCode: 'GB',
      postalCodeRequired: true,
    });

    const nameOnly = schema.safeParse({
      ...GUEST_FIELDS,
      country_code: undefined,
      country: 'United Kingdom',
    });

    expect(nameOnly.success).toBe(false);
    expect(issuesFor(nameOnly)).toContainEqual(expect.objectContaining({
      path: ['country_code'],
    }));
  });
});
