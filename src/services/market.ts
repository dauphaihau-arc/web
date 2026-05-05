import type { UseQueryOptions } from '@tanstack/vue-query';
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import { consola } from 'consola';
import { MARKET_CONFIG } from '~/config/enums/market';
import type { ResponseGetDataByIP, ResponseGetExchangeRates } from '~/types/market';

export function useGetExchangeRates(
  queryOptions?: Partial<UseQueryOptions<ResponseGetExchangeRates>>,
  nitroOptions?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery<ResponseGetExchangeRates>({
    ...queryOptions,
    server: false,
    queryKey: ['get-exchange-rates'],
    queryFn: () => {
      return useCustomFetch.get<ResponseGetExchangeRates>(
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
  queryOptions?: Partial<UseQueryOptions<ResponseGetDataByIP>>,
  nitroOptions?: NitroFetchOptions<NitroFetchRequest>
) {
  return useQuery<ResponseGetDataByIP>({
    ...queryOptions,
    server: false,
    queryKey: ['get-ip-data'],
    queryFn: () => {
      return useCustomFetch.get<ResponseGetDataByIP>(
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
