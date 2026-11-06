import type { UseQueryOptions } from '@tanstack/vue-query';
import { locationApi } from '~/domains/location/api/location.api';
import type { GetCountriesResponse } from '~/domains/location/api/contracts/location.contract';

export function useGetCountries(options?: Partial<UseQueryOptions<GetCountriesResponse>>) {
  return useQuery<GetCountriesResponse>({
    ...options,
    queryKey: ['get-countries'],
    queryFn: () => {
      return locationApi.getCountries();
    },
  });
}
