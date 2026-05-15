import type { ComputedRef } from 'vue';
import type { UseQueryOptions } from '@tanstack/vue-query';
import type { ResponseGetCountries, ResponseGetStatesByCountry } from '~/types/user-address';

export function useGetCountries(options?: Partial<UseQueryOptions<ResponseGetCountries>>) {
  return useQuery<ResponseGetCountries>({
    ...options,
    queryKey: ['get-countries'],
    queryFn: () => {
      return useCustomFetch.get<ResponseGetCountries>(
        'https://countriesnow.space/api/v0.1/countries/iso',
        undefined,
        {
          baseURL: '',
          credentials: undefined,
        }
      );
    },
  });
}

export function useGetStatesByCountry(country: ComputedRef<string | undefined>) {
  return useQuery({
    enabled: false,
    queryKey: ['get-states-by-country', country],
    queryFn: () => {
      return useCustomFetch.post<ResponseGetStatesByCountry>(
        'https://countriesnow.space/api/v0.1/countries/states',
        {
          country: country.value,
        },
        {
          baseURL: '',
          credentials: undefined,
        }
      );
    },
  });
}
