import type { UseQueryOptions } from '@tanstack/vue-query';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { consola } from 'consola';
import { apiClient } from '~/shared/lib/api-client';
import type { IpDataResponse } from '~/shared/market/market.types';

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, string[]>,
  'queryKey' | 'queryFn'
>;

export function useGetDataByIP(
  queryOptions?: QueryOptions<IpDataResponse>,
  nitroOptions?: NitroFetchOptions<NitroFetchRequest>
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
            consola.error('get data by IP failed');
          },
        }
      );
    },
  });
}
