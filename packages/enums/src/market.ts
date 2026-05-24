export enum MarketCurrencies {
  USD = 'USD',
  AUD = 'AUD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  TWD = 'TWD',
  JPY = 'JPY',
  KRW = 'KRW',
  HKD = 'HKD',
  SGD = 'SGD',
  VND = 'VND',
}

export enum MarketLanguages {
  EN = 'en',
  LA = 'la',
  FR = 'fr',
}

export enum MarketRegions {
  UNITED_STATES = 'United States',
  VIET_NAM = 'Vietnam',
}

export const MARKET_REGION_EMOJIS = {
  [MarketRegions.UNITED_STATES]: '🇺🇸',
  [MarketRegions.VIET_NAM]: '🇻🇳',
}

export const MARKET_CONFIG = {
  BASE_LANGUAGE: MarketLanguages.EN,
  BASE_REGION: MarketRegions.UNITED_STATES,
  BASE_CURRENCY: MarketCurrencies.USD,
}
