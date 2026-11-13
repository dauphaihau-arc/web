import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { enableAutoUnmount, flushPromises } from '@vue/test-utils';
import {
  afterEach, describe, expect, it, vi,
} from 'vitest';
import {
  type MaybeRefOrGetter, type PropType, computed, defineComponent, h, nextTick, ref, toValue,
} from 'vue';
import type {
  Country,
  GetCountryAddressRulesResponse,
} from '~/domains/location/api/contracts/location.contract';
import type { UserAddress } from './use-update-user-address-form';
import { useUpdateUserAddressForm } from './use-update-user-address-form';
import UpdateUserAddressDialog from './update-user-address-dialog.vue';

const { closeModal } = vi.hoisted(() => ({ closeModal: vi.fn() }));

mockNuxtImport('useModal', () => () => ({ close: closeModal }));

enableAutoUnmount(afterEach);

const COUNTRIES: Country[] = [
  {
    code: 'US',
    name: 'United States',
    has_administrative_areas: true,
    postal_code_required: true,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    has_administrative_areas: false,
    postal_code_required: true,
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    has_administrative_areas: false,
    postal_code_required: false,
  },
];

vi.mock('~/domains/location/queries/countries.query', () => ({
  useGetCountries: () => ({
    data: ref(COUNTRIES),
    isPending: ref(false),
  }),
  useGetAdministrativeAreas: () => ({
    data: ref([]),
    isFetching: ref(false),
  }),
  useGetAddressRules: (countryCode: MaybeRefOrGetter<string | undefined>) => ({
    data: computed(() => ADDRESS_RULES[toValue(countryCode) ?? '']),
  }),
}));

vi.mock('~/domains/me/mutations/address/update-address.mutation', () => ({
  useUpdateUserAddress: () => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  }),
}));

/** Server-owned rules for the countries under test (US/GB/HK). */
const ADDRESS_RULES: Record<string, GetCountryAddressRulesResponse> = {
  US: {
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
  },
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

type AddressRowOverrides = Partial<UserAddress>;

function addressRow(overrides: AddressRowOverrides): UserAddress {
  return {
    id: 'address-1',
    user: 'user-1',
    full_name: 'Ada Lovelace',
    address_1: '1 Analytical Way',
    address_2: undefined,
    city: 'London',
    state: '',
    zip: '',
    country: 'United Kingdom',
    country_code: 'GB',
    state_code: null,
    phone: '+447700900123',
    is_primary: false,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/**
 * Mounts the composable without the dialog chrome and renders the schema
 * outcome, so the test drives the exact options the dialog validates with.
 */
const composableHarness = defineComponent({
  props: {
    dataEdit: {
      type: Object as PropType<UserAddress>,
      required: true,
    },
  },
  setup(props) {
    const form = useUpdateUserAddressForm(props.dataEdit);
    const hasAdministrativeAreas = form.hasAdministrativeAreas;
    const schema = form.schema;
    const stateSubmit = form.stateSubmit;

    return () => {
      const result = schema.value.safeParse({ ...stateSubmit });
      return h('pre', {
        'data-testid': 'parse-result',
        'data-has-areas': String(hasAdministrativeAreas.value),
      }, JSON.stringify({
        success: result.success,
        zip: result.success ? result.data.zip : undefined,
      }));
    };
  },
});

interface ParseOutcome {
  success: boolean
  zip?: string
}

async function parseOutcome(dataEdit: UserAddress) {
  const wrapper = await mountSuspended(composableHarness, { props: { dataEdit } });
  await nextTick();
  await flushPromises();

  const node = wrapper.get('[data-testid="parse-result"]');
  return {
    hasAdministrativeAreas: node.attributes('data-has-areas') === 'true',
    outcome: JSON.parse(node.text()) as ParseOutcome,
  };
}

async function mountDialog(dataEdit: UserAddress) {
  const wrapper = await mountSuspended(UpdateUserAddressDialog, {
    props: { dataEdit },
    attrs: { modelValue: true },
  });
  await nextTick();
  await flushPromises();
  return wrapper;
}

function fieldLabels() {
  return Array.from(document.querySelectorAll('label'))
    .map(label => label.textContent?.trim() ?? '');
}

describe('update address dialog field rules', () => {
  it('hides the subdivision field for a country without one', async () => {
    await mountDialog(addressRow({}));

    expect(fieldLabels().some(label => /postcode/i.test(label))).toBe(true);
    expect(fieldLabels().some(label => /state|province/i.test(label))).toBe(false);
    expect(document.querySelector('[name="state_text"]')).toBeNull();
    expect(document.querySelector('[name="state_code"]')).toBeNull();
  });

  it('hides the postcode field for a country without postcodes', async () => {
    await mountDialog(addressRow({
      country: 'Hong Kong',
      country_code: 'HK',
      city: 'Central',
      state: 'Central and Western',
      zip: '999999',
      phone: '+85221234567',
    }));

    expect(fieldLabels().some(label => /postcode|zip/i.test(label))).toBe(false);
    expect(document.querySelector('[name="zip"]')).toBeNull();
  });
});

describe('update address schema visibility', () => {
  it('skips subdivision validation for a country that has no subdivision', async () => {
    const { hasAdministrativeAreas, outcome } = await parseOutcome(
      addressRow({ state: '', state_code: null }),
    );

    expect(hasAdministrativeAreas).toBe(false);
    expect(outcome.success).toBe(true);
  });

  it('serializes a hidden postcode to an empty string and skips its validation', async () => {
    const { outcome } = await parseOutcome(addressRow({
      country: 'Hong Kong',
      country_code: 'HK',
      city: 'Central',
      state: 'Central and Western',
      zip: '999999',
      phone: '+85221234567',
    }));

    expect(outcome.success).toBe(true);
    expect(outcome.zip).toBe('');
  });

  it('still requires a subdivision where the country has administrative areas', async () => {
    const { outcome } = await parseOutcome(addressRow({
      country: 'United States',
      country_code: 'US',
      city: 'San Francisco',
      state: '',
      state_code: null,
      zip: '94107',
      phone: '+14155550123',
    }));

    expect(outcome.success).toBe(false);
  });
});
