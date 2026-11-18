import {
  MARKET_CONFIG,
  type MarketRegions,
} from '@arc/enums/market';
import { getFallbackMarketPreferences } from '~/domains/market/stores/market-preferences';

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

/**
 * The header language comes from the URL locale, never from the persisted
 * Buyer Language Preference: `/vi/**` must talk to the API in Vietnamese even
 * when the stored preference (or the market default) still says English.
 *
 * This reads the Nuxt i18n composer rather than `useI18n()` because headers are
 * also built from mutation callbacks and other places without a component
 * instance, where vue-i18n's `useI18n()` throws.
 */
function resolveLocaleLanguage(): string {
  const { $i18n } = useNuxtApp();

  return $i18n.locale.value || MARKET_CONFIG.BASE_LANGUAGE;
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
