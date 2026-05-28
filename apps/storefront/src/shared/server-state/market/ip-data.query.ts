import type { UseQueryOptions } from '@tanstack/vue-query';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { consola } from 'consola';
import type { IpDataResponse } from '~/shared/api/market/contracts/market.contract';
import { apiClient } from '~/shared/lib/api-client';

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, string[]>,
  'queryKey' | 'queryFn'
>;

export const ipDataQueryOptions = {
  queryKey: ['get-ip-data'],
  queryFn: () => {
    return getIpData();
  },
} as const;

export function getIpData() {
  return apiClient.get<IpDataResponse>(
    '/api/ip-data',
    undefined,
    {
      baseURL: '',
      credentials: undefined,
      onResponseError: () => {
        consola.error('get data by IP failed');
      },
    }
  );
}

export function useGetDataByIP(
  queryOptions?: QueryOptions<IpDataResponse>,
  nitroOptions?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery<IpDataResponse>({
    ...queryOptions,
    ...ipDataQueryOptions,
    queryFn: () => {
      return apiClient.get<IpDataResponse>(
        '/api/ip-data',
        undefined,
        {
          ...nitroOptions,
          baseURL: '',
          credentials: undefined,
          onResponseError: () => {
            consola.error('get data by IP failed');
          },
        }
      );
    },
  });
}
