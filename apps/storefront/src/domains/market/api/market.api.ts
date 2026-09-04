import type { MarketConfigResponse } from './contracts/market.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const marketApi = {
  getConfig() {
    return apiClient.get<MarketConfigResponse>('/marketplace/config');
  },
};
