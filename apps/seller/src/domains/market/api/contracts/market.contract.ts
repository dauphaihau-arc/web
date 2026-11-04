import type { components } from '@arc/schemas/api/generated/openapi';
import type { ipDataResponseSchema } from '@arc/schemas/api/market/ip-data.schema';
import type { MarketCurrencies, MarketRegions } from '@arc/enums/market';
import type { z } from 'zod';

type ApiMarket = components['schemas']['MarketplaceMarketResponseDto'];
type ApiConfig = components['schemas']['MarketplaceConfigResponseDto'];

export type IpDataResponse = z.infer<typeof ipDataResponseSchema>;

type MarketConfigMarket =
  Omit<ApiMarket, 'name' | 'defaultCurrency' | 'supportedCurrencies'> & {
    name: MarketRegions
    defaultCurrency: MarketCurrencies
    supportedCurrencies: MarketCurrencies[]
  };

export type MarketConfigResponse =
  Omit<ApiConfig, 'markets'> & { markets: MarketConfigMarket[] };

export interface ExchangeRatesResponse {
  result: string
  provider?: string
  documentation?: string
  terms_of_use?: string
  time_last_update_unix: number
  time_last_update_utc: string
  time_next_update_unix: number
  time_next_update_utc: string
  time_eol_unix?: number
  base_code: string
  rates: Record<string, number>
}
