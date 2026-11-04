import type { components } from '@arc/schemas/api/generated/openapi';
import type { ipDataResponseSchema } from '@arc/schemas/api/market/ip-data.schema';
import type { MarketCurrencies, MarketRegions } from '@arc/enums/market';
import type { z } from 'zod';

type ApiMarket = components['schemas']['MarketplaceMarketResponseDto'];
type ApiConfig = components['schemas']['MarketplaceConfigResponseDto'];

export type IpDataResponse = z.infer<typeof ipDataResponseSchema>;

export type MarketConfigMarket =
  Omit<ApiMarket, 'name' | 'defaultCurrency' | 'supportedCurrencies'> & {
    name: MarketRegions
    defaultCurrency: MarketCurrencies
    supportedCurrencies: MarketCurrencies[]
  };

export type MarketConfigResponse =
  Omit<ApiConfig, 'markets'> & { markets: MarketConfigMarket[] };
