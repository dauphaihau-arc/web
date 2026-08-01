import type { MarketConfigResponse } from './contracts/market.contract';
import { apiClient } from '~/shared/lib/api-client';

export const marketApi = {
  getMarketplaceConfig() {
    return apiClient.get<MarketConfigResponse>(
      '/marketplace/config'
    );
  },
};
