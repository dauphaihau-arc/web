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
];

async function render(state: AddressFormState): Promise<VueWrapper> {
  return mountSuspended(AddressForm, { props: { state } });
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

    expect(options.map(option => option.text())).toEqual(['United States', 'Vietnam', 'Singapore']);
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

    await chooseCountry(wrapper, 'United States');

    expect(state.country_code).toBe('US');
    expect(state.country).toBe('United States');
    expect(state.state_code).toBeUndefined();
    expect(state.state_text).toBeUndefined();
    expect(state.state).toBeUndefined();
    expect(state.zip).toBeUndefined();
    expect(toValue(areaQueryMock.mock.calls.at(-1)![0])).toBe('US');

    const stateOptions = await openOptions(wrapper, 1);
    expect(stateOptions.map(option => option.text())).toEqual(['California', 'New York']);
  });

  it('submits canonical country and subdivision codes', async () => {
    const state = reactive<AddressFormState>({
      full_name: 'Ada Lovelace',
      address_1: '1 Analytical Engine Way',
      city: 'Hanoi',
      phone: '0900000000',
    });
    const wrapper = await render(state);

    await chooseCountry(wrapper, 'Vietnam');
    await chooseSubdivision(wrapper, 'Hanoi');

    // Choosing a country intentionally clears the ZIP field.
    state.zip = '100000';

    await wrapper.find('form').trigger('submit');
    await flushPromises();

    const submitted = wrapper.emitted('submit')?.[0]?.[0] as AddressFormState;

    expect(submitted.country_code).toBe('VN');
    expect(submitted.country).toBe('Vietnam');
    expect(submitted.state_code).toBe('VN-01');
    expect(submitted.state).toBe('Hanoi');
  });
});
