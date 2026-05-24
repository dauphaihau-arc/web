import type { UseQueryOptions } from '@tanstack/vue-query'
import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import { consola } from 'consola'
import { MARKET_CONFIG } from '@arc/enums/market'
import type { ExchangeRatesResponse } from '~/shared/api/market/contracts/market.contract'
import { apiClient } from '~/shared/lib/api-client'

type QueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, string[]>,
  'queryKey' | 'queryFn'
>

export function useGetExchangeRates(
  queryOptions?: QueryOptions<ExchangeRatesResponse>,
  nitroOptions?: NitroFetchOptions<NitroFetchRequest>,
) {
  return useQuery<ExchangeRatesResponse>({
    ...queryOptions,
    queryKey: ['get-exchange-rates'],
    queryFn: () => {
      return apiClient.get<ExchangeRatesResponse>(
        `https://open.er-api.com/v6/latest/${MARKET_CONFIG.BASE_CURRENCY}`,
        undefined,
        {
          ...nitroOptions,
          baseURL: '',
          credentials: undefined,
          onResponseError: () => {
            consola.error('get exchange rates failed')
          },
        },
      )
    },
  })
}
