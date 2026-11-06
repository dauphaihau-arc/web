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

    expect(options.map(option => option.text())).toEqual(['United States', 'Vietnam']);
  });

  it('fetches subdivisions for the ISO code of the selected country', async () => {
    const state = reactive<AddressFormState>({});
    const wrapper = await render(state);

    await chooseCountry(wrapper, 'Vietnam');

    expect(state.country).toBe('Vietnam');
    expect(toValue(areaQueryMock.mock.calls.at(-1)![0])).toBe('VN');

    const stateOptions = await openOptions(wrapper, 1);
    expect(stateOptions.map(option => option.text())).toEqual(['Hanoi']);
  });

  it('swaps subdivision options and clears the chosen state when the country changes', async () => {
    const state = reactive<AddressFormState>({ country: 'Vietnam', state: 'Hanoi' });
    const wrapper = await render(state);

    expect((await openOptions(wrapper, 1)).map(option => option.text())).toEqual(['Hanoi']);

    // Close the state menu so changing the country does not leave it open.
    await wrapper.findAll('[role="button"]')[1]!.trigger('click');
    await flushPromises();

    await chooseCountry(wrapper, 'United States');

    expect(toValue(areaQueryMock.mock.calls.at(-1)![0])).toBe('US');
    expect(state.state).toBeUndefined();

    const stateOptions = await openOptions(wrapper, 1);
    expect(stateOptions.map(option => option.text())).toEqual(['California', 'New York']);
  });
});
