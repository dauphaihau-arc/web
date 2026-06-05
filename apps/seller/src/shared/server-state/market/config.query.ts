import { marketApi } from '~/shared/api/market/market.api'
import type { MarketConfigResponse } from '~/shared/api/market/contracts/market.contract'

export function useGetMarketplaceConfig() {
  return useQuery<MarketConfigResponse>({
    queryKey: ['marketplace-config'],
    queryFn: () => {
      return marketApi.getMarketplaceConfig()
    },
    staleTime: 1000 * 60 * 5,
  })
}
