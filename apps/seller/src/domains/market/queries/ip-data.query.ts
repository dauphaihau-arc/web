import type { UseQueryOptions } from '@tanstack/vue-query';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { log } from '@arc/lib';
import type { IpDataResponse } from '~/domains/market/api/contracts/market.contract';
import { apiClient } from '~/domains/_shared/api-client';

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, string[]>,
  'queryKey' | 'queryFn'
>;

export function useGetDataByIP(
  queryOptions?: QueryOptions<IpDataResponse>,
  nitroOptions?: NitroFetchOptions<NitroFetchRequest>,
) {
  return useQuery<IpDataResponse>({
    ...queryOptions,
    queryKey: ['get-ip-data'],
    queryFn: () => {
      return apiClient.get<IpDataResponse>(
        '/api/ip-data',
        undefined,
        {
          ...nitroOptions,
          baseURL: '',
          credentials: undefined,
          onResponseError: () => {
            log.error('get data by IP failed');
          },
        },
      );
    },
  });
}
