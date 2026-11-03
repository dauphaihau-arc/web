import type { CarrierCatalogueResponse } from './contracts/carrier.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const carrierApi = {
  list() {
    return apiClient.get<CarrierCatalogueResponse>('/carriers');
  },
};
