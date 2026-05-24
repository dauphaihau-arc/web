import { MARKET_CONFIG, MarketCurrencies } from '@arc/enums/market'

const locales = {
  USD: 'en-US',
  AUD: 'aud',
  EUR: 'sfb', // use 'sfb' instead 'eu' to move € before number
  GBP: 'en-GB',
  CAD: 'iu-Cans-CA',
  JPY: 'ja-JP',
  KRW: 'ko-KR',
  SGD: 'sg',
  TWD: 'twd',
  HKD: 'en-HK',
  VND: 'vi-VN',
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
  const formatter = new Intl.NumberFormat(locales[currency], {
    currency,
    minimumFractionDigits: zeroDecimalCurrencies.includes(currency) ? 0 : 2,
    ...options,
    style: 'currency',
  })
  return formatter.format(value)
}
