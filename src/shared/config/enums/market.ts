export enum MARKET_CURRENCIES {
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
  VND = 'VND'
}

export enum MARKET_LANGUAGES {
  EN = 'en',
  LA = 'la',
  FR = 'fr'
}

export enum MARKET_REGIONS {
  UNITED_STATES = 'United States',
  VIET_NAM = 'Vietnam'
}

export const MARKET_REGION_EMOJIS = {
  [MARKET_REGIONS.UNITED_STATES]: '🇺🇸',
  [MARKET_REGIONS.VIET_NAM]: '🇻🇳',
};

export const MARKET_CONFIG = {
  BASE_LANGUAGE: MARKET_LANGUAGES.EN,
  BASE_REGION: MARKET_REGIONS.UNITED_STATES,
  BASE_CURRENCY: MARKET_CURRENCIES.USD,
};
