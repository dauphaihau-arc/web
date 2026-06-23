import {
  MARKET_CONFIG,
  type MarketLanguages,
  type MarketRegions
} from '@arc/enums/market';
import { getFallbackMarketPreferences } from '~/shared/stores/market/market-preferences';

const REQUEST_MARKET_HEADER_NAMES = {
  marketCode: 'X-Market-Code',
  currency: 'X-Currency',
  locale: 'X-Locale',
  channel: 'X-Channel',
} as const;

const REGION_TO_MARKET_CODE: Record<MarketRegions, string> = {
  'United States': 'US',
  Vietnam: 'VN',
};

const REGION_TO_LOCALE_REGION: Record<MarketRegions, string> = {
  'United States': 'US',
  Vietnam: 'VN',
};

function resolveLocaleLanguage(): string {
  const nuxtApp = useNuxtApp();
  const locale = nuxtApp.$i18n?.locale.value;

  if (typeof locale === 'string' && locale.trim()) {
    return locale.trim().toLowerCase();
  }

  const marketStore = useMarketStore();

  return (marketStore.activePreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE) as MarketLanguages;
}

export function getRequestMarketHeaders(): Record<string, string> {
  const marketStore = useMarketStore();
  const preferences = marketStore.activePreferences ?? getFallbackMarketPreferences();
  const region = preferences.region;
  const currency = preferences.currency;
  const language = resolveLocaleLanguage();
  const localeRegion = REGION_TO_LOCALE_REGION[region];

  return {
    [REQUEST_MARKET_HEADER_NAMES.marketCode]: REGION_TO_MARKET_CODE[region],
    [REQUEST_MARKET_HEADER_NAMES.currency]: currency,
    [REQUEST_MARKET_HEADER_NAMES.locale]: `${language}-${localeRegion}`,
    [REQUEST_MARKET_HEADER_NAMES.channel]: 'WEB',
  };
}
