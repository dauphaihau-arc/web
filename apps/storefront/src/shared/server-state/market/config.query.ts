import type { UseQueryOptions } from '@tanstack/vue-query';
import { marketApi } from '~/shared/api/market/market.api';
import type { MarketConfigResponse } from '~/shared/api/market/contracts/market.contract';

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, string[]>,
  'queryKey' | 'queryFn'
>;

export const marketConfigQueryOptions = {
  queryKey: ['get-market-config'],
  queryFn: () => {
    return marketApi.getConfig();
  },
} as const;

export function useGetMarketConfig(queryOptions?: QueryOptions<MarketConfigResponse>) {
  return useQuery<MarketConfigResponse>({
    ...queryOptions,
    ...marketConfigQueryOptions,
  });
}
