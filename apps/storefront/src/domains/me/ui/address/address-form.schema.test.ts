import { describe, expect, it } from 'vitest';
import { createCodedAddressFormSchema } from './address-form.schema';

const REQUIRED_FIELDS = {
  full_name: 'Ada Lovelace',
  address_1: '1 Analytical Engine Way',
  city: 'Test City',
  zip: '00000',
  phone: '0900000000',
};

describe('coded address form schema', () => {
  it('requires a country code and subdivision for a country with administrative areas', () => {
    const schema = createCodedAddressFormSchema(true);

    expect(schema.safeParse(REQUIRED_FIELDS).success).toBe(false);
    expect(schema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'US',
    }).success).toBe(false);
    expect(schema.safeParse({
      ...REQUIRED_FIELDS,
      country_code: 'US',
      state_code: 'US-CA',
    }).success).toBe(true);
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
});
