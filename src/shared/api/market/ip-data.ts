import type { MarketCurrencies, MarketRegions } from '~/shared/config/enums/market';

export type IpDataResponse = Record<
  'emoji_flag' | 'region' | 'city', string
> & {
  country_name: MarketRegions
  currency: { code: MarketCurrencies }
};
