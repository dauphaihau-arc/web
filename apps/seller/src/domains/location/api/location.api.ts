import type { GetCountriesResponse } from './contracts/location.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const locationApi = {
  getCountries() {
    return apiClient.get<GetCountriesResponse>('locations/countries');
  },
};
