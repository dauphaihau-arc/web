import type { MaybeRefOrGetter } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { VueWrapper } from '@vue/test-utils';
import { flushPromises } from '@vue/test-utils';
import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';
import {
  computed, nextTick, reactive, ref, toValue,
} from 'vue';
import type { Country } from '~/domains/location/api/contracts/location.contract';
import type { AddressFormState } from './address-form.types';
import { PHONE_INVALID } from './address-validation';
import AddressForm from './address-form.vue';

const locationState = vi.hoisted(() => ({
  countries: [] as Country[],
  areasByCode: {} as Record<string, Array<{ code: string, name: string }>>,
}));

const areaQueryMock = vi.hoisted(() => vi.fn());

// The factory only closes over `computed`/`ref`/`toValue`; Vitest hoists it
// above the imports, so they must not be dereferenced until a test mounts.
vi.mock('~/domains/location/queries/countries.query', () => ({
  useGetCountries: () => ({
    data: computed(() => locationState.countries),
    isPending: ref(false),
  }),
  useGetAdministrativeAreas: (countryCode: MaybeRefOrGetter<string | undefined>) => {
    areaQueryMock(countryCode);

    return {
      data: computed(() => locationState.areasByCode[toValue(countryCode) ?? ''] ?? []),
      isFetching: ref(false),
    };
  },
}));

const COUNTRIES: Country[] = [
  {
    code: 'US',
    name: 'United States',
    has_administrative_areas: true,
    postal_code_required: true,
  },
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
  {
    code: 'GB',
    name: 'United Kingdom',
    has_administrative_areas: false,
    postal_code_required: true,
  },
];

async function render(state: AddressFormState, guest = false): Promise<VueWrapper> {
  return mountSuspended(AddressForm, { props: { state, guest } });
}

async function openOptions(wrapper: VueWrapper, triggerIndex: number) {
  await wrapper.findAll('[role="button"]')[triggerIndex]!.trigger('click');
  await flushPromises();
  await nextTick();

  return wrapper.findAll('[role="option"]');
}

async function chooseCountry(wrapper: VueWrapper, name: string) {
  const options = await openOptions(wrapper, 0);
  const option = options.find(candidate => candidate.text() === name);

  expect(option).toBeDefined();
  // Headless UI selects a combobox option on mousedown.
  await option!.trigger('mousedown');
  await flushPromises();
  await nextTick();
}

async function chooseSubdivision(wrapper: VueWrapper, name: string) {
  const options = await openOptions(wrapper, 1);
  const option = options.find(candidate => candidate.text() === name);

  expect(option).toBeDefined();
  await option!.trigger('mousedown');
  await flushPromises();
  await nextTick();
}

describe('address form location options', () => {
  beforeEach(() => {
    locationState.countries = COUNTRIES;
    locationState.areasByCode = {
      US: [
        { code: 'US-CA', name: 'California' },
        { code: 'US-NY', name: 'New York' },
      ],
      VN: [
        { code: 'VN-01', name: 'Hanoi' },
      ],
    };
    areaQueryMock.mockReset();
  });

  it('renders the countries served by the Arc location endpoint', async () => {
    const wrapper = await render({});

    const options = await openOptions(wrapper, 0);

    expect(options.map(option => option.text())).toEqual(['United States', 'Vietnam', 'Singapore', 'United Kingdom']);
  });

  it('selects countries by code while keeping the display name and fetches subdivisions for it', async () => {
    const state = reactive<AddressFormState>({});
    const wrapper = await render(state);

    await chooseCountry(wrapper, 'Vietnam');

    expect(state.country_code).toBe('VN');
    expect(state.country).toBe('Vietnam');
    expect(toValue(areaQueryMock.mock.calls.at(-1)![0])).toBe('VN');

    const stateOptions = await openOptions(wrapper, 1);
    expect(stateOptions.map(option => option.text())).toEqual(['Hanoi']);

    const hanoi = stateOptions.find(option => option.text() === 'Hanoi');
    expect(hanoi).toBeDefined();
    await hanoi!.trigger('mousedown');
    await flushPromises();
    await nextTick();

    expect(state.state_code).toBe('VN-01');
    expect(state.state).toBe('Hanoi');
  });

  it('switches the subdivision control from a dropdown to free text based on has_administrative_areas', async () => {
    const state = reactive<AddressFormState>({});
    const wrapper = await render(state);

    await chooseCountry(wrapper, 'Vietnam');
    expect(wrapper.findAll('[role="button"]')).toHaveLength(2);

    await chooseCountry(wrapper, 'Singapore');

    expect(wrapper.findAll('[role="button"]')).toHaveLength(1);

    const stateText = wrapper.find('input[name="state_text"]');
    expect(stateText.exists()).toBe(true);

    await stateText.setValue('Central Region');

    expect(state.state_text).toBe('Central Region');
    expect(state.state).toBe('Central Region');
  });

  it('clears the subdivision and zip when the country changes', async () => {
    const state = reactive<AddressFormState>({
      country_code: 'VN',
      country: 'Vietnam',
      state_code: 'VN-01',
      state: 'Hanoi',
      zip: '100000',
    });
    const wrapper = await render(state);

    await wrapper.find('input[name="phone"]').setValue('0900000000');
    expect(state.phone).toBe('+84900000000');

    await chooseCountry(wrapper, 'United States');

    expect(state.country_code).toBe('US');
    expect(state.country).toBe('United States');
    expect(state.state_code).toBeUndefined();
    expect(state.state_text).toBeUndefined();
    expect(state.state).toBeUndefined();
    expect(state.zip).toBeUndefined();
    expect(state.phone).toBeUndefined();
    expect(toValue(areaQueryMock.mock.calls.at(-1)![0])).toBe('US');

    const stateOptions = await openOptions(wrapper, 1);
    expect(stateOptions.map(option => option.text())).toEqual(['California', 'New York']);
  });

  it('submits canonical country and subdivision codes', async () => {
    const state = reactive<AddressFormState>({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      city: 'Hanoi',
    });
    const wrapper = await render(state);

    await chooseCountry(wrapper, 'Vietnam');
    await chooseSubdivision(wrapper, 'Hanoi');

    // Choosing a country intentionally clears the ZIP and phone fields.
    state.zip = '100000';
    await wrapper.find('input[name="phone"]').setValue('0900000000');
    expect(state.phone).toBe('+84900000000');

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    const submitted = wrapper.emitted('submit')?.[0]?.[0] as AddressFormState;

    expect(submitted.country_code).toBe('VN');
    expect(submitted.country).toBe('Vietnam');
    expect(submitted.state_code).toBe('VN-01');
    expect(submitted.state).toBe('Hanoi');
  });

  it('accepts alphanumeric postcodes and international phone entry', async () => {
    const state = reactive<AddressFormState>({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      city: 'London',
      country_code: 'GB',
      country: 'United Kingdom',
    });
    const wrapper = await render(state);

    await wrapper.find('input[name="zip"]').setValue('sw1a 1aa');
    expect(state.zip).toBe('sw1a 1aa');

    await wrapper.find('input[name="phone"]').setValue('020 7946 0958');
    expect(state.phone).toBe('+442079460958');

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    const submitted = wrapper.emitted('submit')?.[0]?.[0] as AddressFormState;

    expect(submitted.zip).toBe('SW1A 1AA');
    expect(submitted.phone).toBe('+442079460958');
  });

  it('shows a field-scoped error for an invalid phone and accepts a valid one', async () => {
    const state = reactive<AddressFormState>({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      city: 'Boston',
      country_code: 'US',
      country: 'United States',
      state_code: 'US-CA',
      state: 'California',
      zip: '00000',
    });
    const wrapper = await render(state);
    const phone = wrapper.find('input[name="phone"]');

    await phone.setValue('12345');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.text()).toContain(PHONE_INVALID);

    await phone.setValue('415 555 2671');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    const submitted = wrapper.emitted('submit')?.[0]?.[0] as AddressFormState;
    expect(submitted.phone).toBe('+14155552671');
  });

  it('labels the postcode optional and accepts an empty value for a country without postal codes', async () => {
    const state = reactive<AddressFormState>({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      city: 'Hanoi',
      country_code: 'VN',
      country: 'Vietnam',
      state_code: 'VN-01',
      state: 'Hanoi',
    });
    const wrapper = await render(state);

    expect(wrapper.text()).toContain('Zip/Postal code (optional)');

    await wrapper.find('input[name="phone"]').setValue('0912345678');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    const submitted = wrapper.emitted('submit')?.[0]?.[0] as AddressFormState;
    expect(submitted.zip).toBe('');
  });

  it('applies the same phone and postcode rules to the guest form', async () => {
    const state = reactive<AddressFormState>({
      email: 'ada@example.com',
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      city: 'London',
      country_code: 'GB',
      country: 'United Kingdom',
    });
    const wrapper = await render(state, true);

    await wrapper.find('input[name="zip"]').setValue('sw1a 1aa');
    await wrapper.find('input[name="phone"]').setValue('12345');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.emitted('submit')).toBeUndefined();
    expect(wrapper.text()).toContain(PHONE_INVALID);

    await wrapper.find('input[name="phone"]').setValue('020 7946 0958');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    const submitted = wrapper.emitted('submit')?.[0]?.[0] as AddressFormState;
    expect(submitted.zip).toBe('SW1A 1AA');
    expect(submitted.phone).toBe('+442079460958');
  });
});
