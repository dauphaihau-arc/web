import type {
  GetCountriesResponse,
  GetStatesByCountryRequest,
  GetStatesByCountryResponse
} from './countries';
import { apiClient } from '~/shared/lib/api-client';

export const locationApi = {
  getCountries() {
    return apiClient.get<GetCountriesResponse>(
      'https://countriesnow.space/api/v0.1/countries/iso',
      undefined,
      {
        baseURL: '',
        credentials: undefined,
      }
    );
  },

  getStatesByCountry(payload: GetStatesByCountryRequest) {
    return apiClient.post<GetStatesByCountryResponse>(
      'https://countriesnow.space/api/v0.1/countries/states',
      payload,
      {
        baseURL: '',
        credentials: undefined,
      }
    );
  },
};
