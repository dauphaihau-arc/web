export enum MarketCurrencies {
  USD = 'USD',
  AUD = 'AUD',
  BRL = 'BRL',
  CHF = 'CHF',
  CNY = 'CNY',
  CZK = 'CZK',
  DKK = 'DKK',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  HKD = 'HKD',
  HUF = 'HUF',
  IDR = 'IDR',
  ILS = 'ILS',
  INR = 'INR',
  JPY = 'JPY',
  KRW = 'KRW',
  MAD = 'MAD',
  MXN = 'MXN',
  MYR = 'MYR',
  NOK = 'NOK',
  NZD = 'NZD',
  PHP = 'PHP',
  PLN = 'PLN',
  SEK = 'SEK',
  SGD = 'SGD',
  THB = 'THB',
  TRY = 'TRY',
  TWD = 'TWD',
  VND = 'VND',
  ZAR = 'ZAR',
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
