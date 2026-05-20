import type { ComputedRef } from 'vue';
import type { UseQueryOptions } from '@tanstack/vue-query';
import { locationApi } from '~/shared/api/location/location.api';
import type { GetCountriesResponse, GetStatesByCountryResponse } from '~/shared/api/location/countries';

export function useGetCountries(options?: Partial<UseQueryOptions<GetCountriesResponse>>) {
  return useQuery<GetCountriesResponse>({
    ...options,
    queryKey: ['get-countries'],
    queryFn: () => {
      return locationApi.getCountries();
    },
  });
}

export function useGetStatesByCountry(country: ComputedRef<string | undefined>) {
  return useQuery({
    enabled: false,
    queryKey: ['get-states-by-country', country],
    queryFn: () => {
      return locationApi.getStatesByCountry({
        country: country.value,
      }) as Promise<GetStatesByCountryResponse>;
    },
  });
}
