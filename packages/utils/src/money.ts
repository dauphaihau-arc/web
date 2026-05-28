import { MarketCurrencies } from '@arc/enums/market'
import formatCurrency from './format-currency'

const MINOR_UNIT_SCALE: Record<string, number> = {
  [MarketCurrencies.USD]: 100,
  [MarketCurrencies.AUD]: 100,
  [MarketCurrencies.BRL]: 100,
  [MarketCurrencies.CHF]: 100,
  [MarketCurrencies.CNY]: 100,
  [MarketCurrencies.CZK]: 100,
  [MarketCurrencies.DKK]: 100,
  [MarketCurrencies.EUR]: 100,
  [MarketCurrencies.GBP]: 100,
  [MarketCurrencies.CAD]: 100,
  [MarketCurrencies.HKD]: 100,
  [MarketCurrencies.HUF]: 100,
  [MarketCurrencies.IDR]: 100,
  [MarketCurrencies.ILS]: 100,
  [MarketCurrencies.INR]: 100,
  [MarketCurrencies.JPY]: 1,
  [MarketCurrencies.KRW]: 1,
  [MarketCurrencies.MAD]: 100,
  [MarketCurrencies.MXN]: 100,
  [MarketCurrencies.MYR]: 100,
  [MarketCurrencies.NOK]: 100,
  [MarketCurrencies.NZD]: 100,
  [MarketCurrencies.PHP]: 100,
  [MarketCurrencies.PLN]: 100,
  [MarketCurrencies.SEK]: 100,
  [MarketCurrencies.SGD]: 100,
  [MarketCurrencies.THB]: 100,
  [MarketCurrencies.TRY]: 100,
  [MarketCurrencies.TWD]: 100,
  [MarketCurrencies.VND]: 1,
  [MarketCurrencies.ZAR]: 100,
}

export function fromMinorUnits(amountMinor: number, currency: string) {
  const scale = MINOR_UNIT_SCALE[currency] ?? 100
  return amountMinor / scale
}

export function toMinorUnits(amount: number, currency: string) {
  const scale = MINOR_UNIT_SCALE[currency] ?? 100
  return Math.round(amount * scale)
}

export function formatMinorCurrency(
  amountMinor: number | undefined,
  currency: string | undefined,
  options?: Intl.NumberFormatOptions,
) {
  if (typeof amountMinor !== 'number' || !currency) {
    return formatCurrency(undefined, undefined, options)
  }

  return formatCurrency(fromMinorUnits(amountMinor, currency), currency as MarketCurrencies, options)
}
