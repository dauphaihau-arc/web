import {
  MARKET_CONFIG,
  type MarketLanguages,
  type MarketRegions,
} from '@arc/enums/market'

const REQUEST_MARKET_HEADER_NAMES = {
  marketCode: 'X-Market-Code',
  currency: 'X-Currency',
  locale: 'X-Locale',
  channel: 'X-Channel',
} as const

const REGION_TO_MARKET_CODE: Record<MarketRegions, string> = {
  'United States': 'US',
  Vietnam: 'VN',
}

const REGION_TO_LOCALE_REGION: Record<MarketRegions, string> = {
  'United States': 'US',
  Vietnam: 'VN',
}

function resolveLocaleLanguage(): string {
  const nuxtApp = useNuxtApp()
  const locale = nuxtApp.$i18n?.locale.value

  if (typeof locale === 'string' && locale.trim()) {
    return locale.trim().toLowerCase()
  }

  if (!import.meta.client) {
    return MARKET_CONFIG.BASE_LANGUAGE
  }

  const marketStore = useMarketStore()

  return (marketStore.guestPreferences?.language ?? MARKET_CONFIG.BASE_LANGUAGE) as MarketLanguages
}

export function getRequestMarketHeaders(): Record<string, string> {
  const marketStore = import.meta.client ? useMarketStore() : undefined
  const region = marketStore?.guestPreferences?.region ?? MARKET_CONFIG.BASE_REGION
  const currency = marketStore?.guestPreferences?.currency ?? MARKET_CONFIG.BASE_CURRENCY
  const language = resolveLocaleLanguage()
  const localeRegion = REGION_TO_LOCALE_REGION[region]

  return {
    [REQUEST_MARKET_HEADER_NAMES.marketCode]: REGION_TO_MARKET_CODE[region],
    [REQUEST_MARKET_HEADER_NAMES.currency]: currency,
    [REQUEST_MARKET_HEADER_NAMES.locale]: `${language}-${localeRegion}`,
    [REQUEST_MARKET_HEADER_NAMES.channel]: 'WEB',
  }
}
