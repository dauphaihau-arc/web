import type { UseQueryOptions } from '@tanstack/vue-query';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { consola } from 'consola';
import { MARKET_CONFIG } from '~/shared/config/enums/market';
import { apiClient } from '~/shared/lib/api-client';
import type { ResponseGetDataByIP, ResponseGetExchangeRates } from '~/shared/types/market';

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, string[]>,
  'queryKey' | 'queryFn'
>;

export function useGetExchangeRates(
  queryOptions?: QueryOptions<ResponseGetExchangeRates>,
  nitroOptions?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery<ResponseGetExchangeRates>({
    ...queryOptions,
    queryKey: ['get-exchange-rates'],
    queryFn: () => {
      return apiClient.get<ResponseGetExchangeRates>(
        `https://open.er-api.com/v6/latest/${MARKET_CONFIG.BASE_CURRENCY}`,
        undefined,
        {
          ...nitroOptions,
          baseURL: '',
          credentials: undefined,
          onResponseError: () => {
            consola.error('get exchange rates failed');
          },
        }
      );
    },
  });
}

export function useGetDataByIP(
  queryOptions?: QueryOptions<ResponseGetDataByIP>,
  nitroOptions?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery<ResponseGetDataByIP>({
    ...queryOptions,
    queryKey: ['get-ip-data'],
    queryFn: () => {
      return apiClient.get<ResponseGetDataByIP>(
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
