import { marketApi } from '~/domains/market/api/market.api';
import type { MarketConfigResponse } from '~/domains/market/api/contracts/market.contract';

export function useGetMarketplaceConfig() {
  return useQuery<MarketConfigResponse>({
    queryKey: ['marketplace-config'],
    queryFn: () => {
      return marketApi.getMarketplaceConfig();
    },
    staleTime: 1000 * 60 * 5,
  });
}
