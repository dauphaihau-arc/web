import type {
  GetAdministrativeAreasResponse,
  GetCountriesResponse,
  GetCountryAddressRulesResponse,
} from './contracts/location.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const locationApi = {
  getCountries() {
    return apiClient.get<GetCountriesResponse>('locations/countries');
  },

  getAdministrativeAreas(countryCode: string) {
    return apiClient.get<GetAdministrativeAreasResponse>(
      `locations/countries/${encodeURIComponent(countryCode)}/administrative-areas`,
    );
  },

  getAddressRules(countryCode: string) {
    return apiClient.get<GetCountryAddressRulesResponse>(
      `locations/countries/${encodeURIComponent(countryCode)}/address-rules`,
    );
  },
};
