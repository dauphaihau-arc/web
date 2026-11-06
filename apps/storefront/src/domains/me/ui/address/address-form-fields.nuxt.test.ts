import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';
import type { Country } from '~/domains/location/api/contracts/location.contract';
import AddressFormFields from './address-form-fields.vue';
import type { AddressFieldRule } from './address-field-rules';
import type { AddressFormState } from './address-form.types';

const US: Country = {
  code: 'US',
  name: 'United States',
  has_administrative_areas: true,
  postal_code_required: true,
};

const RULES: AddressFieldRule[] = [
  {
    key: 'full_name', label: 'Full Name', visible: true, required: true, control: 'text', autocomplete: 'name', maxLength: 200,
  },
  {
    key: 'address_1', label: 'Street', visible: true, required: true, control: 'text', autocomplete: 'address-line1', maxLength: 200,
  },
  {
    key: 'city', label: 'City', visible: true, required: true, control: 'text', autocomplete: 'address-level2', maxLength: 100,
  },
  {
    key: 'subdivision', label: 'State', visible: true, required: true, control: 'select', autocomplete: 'address-level1', maxLength: 100,
  },
  {
    key: 'zip', label: 'ZIP code', visible: true, required: true, control: 'text', autocomplete: 'postal-code', maxLength: 20,
  },
  {
    key: 'phone', label: 'Phone', visible: true, required: true, control: 'tel', autocomplete: 'tel', maxLength: 20,
  },
];

describe('address form fields', () => {
  it('renders the legacy subdivision with its replacement action', async () => {
    const state = reactive<AddressFormState>({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Way',
      city: 'San Francisco',
      country: 'United States',
      country_code: 'US',
      zip: '94107',
      phone: '+14155550123',
    });

    const wrapper = await mountSuspended(AddressFormFields, {
      props: {
        state,
        fields: RULES,
        countries: [US],
        hasAdministrativeAreas: true,
        postalCodeRequired: true,
        subdivisionFieldName: 'state_code',
        readOnlySubdivisionLabel: 'Legacy County',
        isLegacySubdivision: true,
      },
    });

    expect(wrapper.text()).toContain('Legacy County');
    expect(wrapper.text()).toContain('Choose from list');

    const choose = wrapper.findAll('button').find(button => button.text() === 'Choose from list');
    expect(choose).toBeDefined();
    await choose!.trigger('click');

    expect(wrapper.emitted('chooseSubdivision')).toHaveLength(1);
  });
});
