import { MARKET_CONFIG, MARKET_CURRENCIES } from '~/config/enums/market';

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
};

const zeroDecimalCurrencies = [MARKET_CURRENCIES.KRW, MARKET_CURRENCIES.JPY, MARKET_CURRENCIES.VND];

export default function (
  value: number | undefined,
  currency = MARKET_CONFIG.BASE_CURRENCY,
  options?: Intl.NumberFormatOptions
) {
  if (typeof value !== 'number') {
    value = 0;
  }
  if (locales[currency] === locales.VND) {
    const valueFixed = value.toFixed(0) ?? value.toString();
    return '₫' + valueFixed.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  const formatter = new Intl.NumberFormat(locales[currency], {
    currency,
    minimumFractionDigits: zeroDecimalCurrencies.includes(currency) ? 0 : 2,
    ...options,
    style: 'currency',
  });
  return formatter.format(value);
}
