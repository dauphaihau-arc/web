import { MARKET_CONFIG, MarketCurrencies } from '@arc/enums/market'

const locales = {
  USD: 'en-US',
  AUD: 'en-US',
  BRL: 'pt-BR',
  CHF: 'de-CH',
  CNY: 'zh-CN',
  CZK: 'cs-CZ',
  DKK: 'da-DK',
  EUR: 'sfb', // use 'sfb' instead 'eu' to move € before number
  GBP: 'en-GB',
  CAD: 'en-US',
  HUF: 'hu-HU',
  IDR: 'id-ID',
  ILS: 'he-IL',
  INR: 'en-IN',
  JPY: 'ja-JP',
  KRW: 'ko-KR',
  MAD: 'fr-MA',
  MXN: 'es-MX',
  MYR: 'ms-MY',
  NOK: 'nb-NO',
  NZD: 'en-US',
  PHP: 'en-PH',
  PLN: 'pl-PL',
  SEK: 'sv-SE',
  SGD: 'en-US',
  THB: 'th-TH',
  TRY: 'tr-TR',
  TWD: 'twd',
  HKD: 'en-HK',
  VND: 'vi-VN',
  ZAR: 'en-ZA',
}

const zeroDecimalCurrencies = [MarketCurrencies.KRW, MarketCurrencies.JPY, MarketCurrencies.VND]

export default function (
  value: number | undefined,
  currency = MARKET_CONFIG.BASE_CURRENCY,
  options?: Intl.NumberFormatOptions,
) {
  if (typeof value !== 'number') {
    value = 0
  }
  if (locales[currency] === locales.VND) {
    const valueFixed = value.toFixed(0) ?? value.toString()
    return '₫' + valueFixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  if (currency === MarketCurrencies.CNY) {
    const formatter = new Intl.NumberFormat(locales.CNY, {
      minimumFractionDigits: 2,
      ...options,
    })
    return `CN¥${formatter.format(value)}`
  }
  const formatter = new Intl.NumberFormat(locales[currency], {
    currency,
    minimumFractionDigits: zeroDecimalCurrencies.includes(currency) ? 0 : 2,
    ...options,
    style: 'currency',
  })
  return formatter.format(value)
}
