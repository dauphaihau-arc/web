import {
  MARKET_CONFIG,
  MarketCurrencies,
} from '@arc/enums/market'

export type CurrencyOption = {
  id: MarketCurrencies
  shortLabel: MarketCurrencies
  label: string
  symbol: string
  displayLabel: string
}

const currencyOptionById: Record<MarketCurrencies, CurrencyOption> = {
  [MarketCurrencies.USD]: { id: MarketCurrencies.USD, shortLabel: MarketCurrencies.USD, label: 'United States Dollar (USD)', symbol: '$', displayLabel: '$ United States Dollar (USD)' },
  [MarketCurrencies.CAD]: { id: MarketCurrencies.CAD, shortLabel: MarketCurrencies.CAD, label: 'Canadian Dollar (CAD)', symbol: '$', displayLabel: '$ Canadian Dollar (CAD)' },
  [MarketCurrencies.AUD]: { id: MarketCurrencies.AUD, shortLabel: MarketCurrencies.AUD, label: 'Australian Dollar (AUD)', symbol: '$', displayLabel: '$ Australian Dollar (AUD)' },
  [MarketCurrencies.BRL]: { id: MarketCurrencies.BRL, shortLabel: MarketCurrencies.BRL, label: 'Brazilian Real (BRL)', symbol: 'R$', displayLabel: 'R$ Brazilian Real (BRL)' },
  [MarketCurrencies.CHF]: { id: MarketCurrencies.CHF, shortLabel: MarketCurrencies.CHF, label: 'Swiss Franc (CHF)', symbol: 'CHF', displayLabel: 'CHF Swiss Franc (CHF)' },
  [MarketCurrencies.CNY]: { id: MarketCurrencies.CNY, shortLabel: MarketCurrencies.CNY, label: 'Chinese Yuan (CNY)', symbol: '¥', displayLabel: '¥ Chinese Yuan (CNY)' },
  [MarketCurrencies.CZK]: { id: MarketCurrencies.CZK, shortLabel: MarketCurrencies.CZK, label: 'Czech Koruna (CZK)', symbol: 'Kc', displayLabel: 'Kc Czech Koruna (CZK)' },
  [MarketCurrencies.DKK]: { id: MarketCurrencies.DKK, shortLabel: MarketCurrencies.DKK, label: 'Danish Krone (DKK)', symbol: 'kr', displayLabel: 'kr Danish Krone (DKK)' },
  [MarketCurrencies.EUR]: { id: MarketCurrencies.EUR, shortLabel: MarketCurrencies.EUR, label: 'Euro (EUR)', symbol: '€', displayLabel: '€ Euro (EUR)' },
  [MarketCurrencies.GBP]: { id: MarketCurrencies.GBP, shortLabel: MarketCurrencies.GBP, label: 'British Pound (GBP)', symbol: '£', displayLabel: '£ British Pound (GBP)' },
  [MarketCurrencies.HKD]: { id: MarketCurrencies.HKD, shortLabel: MarketCurrencies.HKD, label: 'Hong Kong Dollar (HKD)', symbol: '$', displayLabel: '$ Hong Kong Dollar (HKD)' },
  [MarketCurrencies.HUF]: { id: MarketCurrencies.HUF, shortLabel: MarketCurrencies.HUF, label: 'Hungarian Forint (HUF)', symbol: 'Ft', displayLabel: 'Ft Hungarian Forint (HUF)' },
  [MarketCurrencies.IDR]: { id: MarketCurrencies.IDR, shortLabel: MarketCurrencies.IDR, label: 'Indonesian Rupiah (IDR)', symbol: 'Rp', displayLabel: 'Rp Indonesian Rupiah (IDR)' },
  [MarketCurrencies.ILS]: { id: MarketCurrencies.ILS, shortLabel: MarketCurrencies.ILS, label: 'Israeli Shekel (ILS)', symbol: '₪', displayLabel: '₪ Israeli Shekel (ILS)' },
  [MarketCurrencies.INR]: { id: MarketCurrencies.INR, shortLabel: MarketCurrencies.INR, label: 'Indian Rupee (INR)', symbol: '₹', displayLabel: '₹ Indian Rupee (INR)' },
  [MarketCurrencies.JPY]: { id: MarketCurrencies.JPY, shortLabel: MarketCurrencies.JPY, label: 'Japanese Yen (JPY)', symbol: '¥', displayLabel: '¥ Japanese Yen (JPY)' },
  [MarketCurrencies.KRW]: { id: MarketCurrencies.KRW, shortLabel: MarketCurrencies.KRW, label: 'Korean Won (KRW)', symbol: '₩', displayLabel: '₩ Korean Won (KRW)' },
  [MarketCurrencies.MAD]: { id: MarketCurrencies.MAD, shortLabel: MarketCurrencies.MAD, label: 'Moroccan Dirham (MAD)', symbol: 'DH', displayLabel: 'DH Moroccan Dirham (MAD)' },
  [MarketCurrencies.MXN]: { id: MarketCurrencies.MXN, shortLabel: MarketCurrencies.MXN, label: 'Mexican Peso (MXN)', symbol: '$', displayLabel: '$ Mexican Peso (MXN)' },
  [MarketCurrencies.MYR]: { id: MarketCurrencies.MYR, shortLabel: MarketCurrencies.MYR, label: 'Malaysian Ringgit (MYR)', symbol: 'RM', displayLabel: 'RM Malaysian Ringgit (MYR)' },
  [MarketCurrencies.NOK]: { id: MarketCurrencies.NOK, shortLabel: MarketCurrencies.NOK, label: 'Norwegian Krone (NOK)', symbol: 'kr', displayLabel: 'kr Norwegian Krone (NOK)' },
  [MarketCurrencies.NZD]: { id: MarketCurrencies.NZD, shortLabel: MarketCurrencies.NZD, label: 'New Zealand Dollar (NZD)', symbol: '$', displayLabel: '$ New Zealand Dollar (NZD)' },
  [MarketCurrencies.PHP]: { id: MarketCurrencies.PHP, shortLabel: MarketCurrencies.PHP, label: 'Philippine Peso (PHP)', symbol: '₱', displayLabel: '₱ Philippine Peso (PHP)' },
  [MarketCurrencies.PLN]: { id: MarketCurrencies.PLN, shortLabel: MarketCurrencies.PLN, label: 'Polish Zloty (PLN)', symbol: 'zl', displayLabel: 'zl Polish Zloty (PLN)' },
  [MarketCurrencies.SEK]: { id: MarketCurrencies.SEK, shortLabel: MarketCurrencies.SEK, label: 'Swedish Krona (SEK)', symbol: 'kr', displayLabel: 'kr Swedish Krona (SEK)' },
  [MarketCurrencies.SGD]: { id: MarketCurrencies.SGD, shortLabel: MarketCurrencies.SGD, label: 'Singapore Dollar (SGD)', symbol: '$', displayLabel: '$ Singapore Dollar (SGD)' },
  [MarketCurrencies.THB]: { id: MarketCurrencies.THB, shortLabel: MarketCurrencies.THB, label: 'Thai Baht (THB)', symbol: '฿', displayLabel: '฿ Thai Baht (THB)' },
  [MarketCurrencies.TRY]: { id: MarketCurrencies.TRY, shortLabel: MarketCurrencies.TRY, label: 'Turkish Lira (TRY)', symbol: '₺', displayLabel: '₺ Turkish Lira (TRY)' },
  [MarketCurrencies.TWD]: { id: MarketCurrencies.TWD, shortLabel: MarketCurrencies.TWD, label: 'Taiwan New Dollar (TWD)', symbol: 'NT$', displayLabel: 'NT$ Taiwan New Dollar (TWD)' },
  [MarketCurrencies.VND]: { id: MarketCurrencies.VND, shortLabel: MarketCurrencies.VND, label: 'Vietnamese Dong (VND)', symbol: '₫', displayLabel: '₫ Vietnamese Dong (VND)' },
  [MarketCurrencies.ZAR]: { id: MarketCurrencies.ZAR, shortLabel: MarketCurrencies.ZAR, label: 'South African Rand (ZAR)', symbol: 'R', displayLabel: 'R South African Rand (ZAR)' },
}

export const currencyOptions = Object.values(currencyOptionById)

export const defaultCurrencyOption = currencyOptionById[MARKET_CONFIG.BASE_CURRENCY]

export function toCurrencyOption(currency: MarketCurrencies): CurrencyOption {
  return currencyOptionById[currency]
}
