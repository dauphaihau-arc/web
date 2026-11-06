import type { MaybeRefOrGetter } from 'vue';
import type { UseQueryOptions } from '@tanstack/vue-query';
import { locationApi } from '~/domains/location/api/location.api';
import type {
  GetAdministrativeAreasResponse,
  GetCountriesResponse,
  GetCountryAddressRulesResponse,
} from '~/domains/location/api/contracts/location.contract';

export function useGetCountries(options?: Partial<UseQueryOptions<GetCountriesResponse>>) {
  return useQuery<GetCountriesResponse>({
    ...options,
    queryKey: ['get-location-countries'],
    queryFn: () => {
      return locationApi.getCountries();
    },
  });
}

/**
 * The API takes the ISO country code, not the display name. Callers resolve the
 * code from the countries response, so the query stays disabled until it does.
 */
export function useGetAdministrativeAreas(
  countryCode: MaybeRefOrGetter<string | undefined>,
) {
  const code = computed(() => toValue(countryCode)?.trim().toUpperCase() || undefined);

  return useQuery<GetAdministrativeAreasResponse>({
    enabled: computed(() => !!code.value),
    queryKey: computed(() => ['get-location-administrative-areas', code.value]),
    queryFn: () => {
      return locationApi.getAdministrativeAreas(code.value!);
    },
  });
}

export function useGetAddressRules(
  countryCode: MaybeRefOrGetter<string | undefined>,
) {
  const code = computed(() => toValue(countryCode)?.trim().toUpperCase() || undefined);

  return useQuery<GetCountryAddressRulesResponse>({
    enabled: computed(() => !!code.value),
    queryKey: computed(() => ['get-location-address-rules', code.value]),
    queryFn: () => locationApi.getAddressRules(code.value!),
  });
}
