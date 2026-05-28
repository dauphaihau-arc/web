import {
  MARKET_CONFIG,
  MarketCurrencies,
  MarketLanguages,
  type MarketRegions,
} from '@arc/enums/market'

export type CurrencyOption = {
  id: MarketCurrencies
  label: string
  symbol: string
  displayLabel: string
}

export type LanguageOption = {
  id: MarketLanguages
  label: string
}

export type PreferenceState = {
  region: MarketRegions
  language: MarketLanguages
  currency: MarketCurrencies
}

const currencyOptionById: Record<MarketCurrencies, CurrencyOption> = {
  [MarketCurrencies.USD]: { id: MarketCurrencies.USD, label: 'United States Dollar (USD)', symbol: '$', displayLabel: '$ United States Dollar (USD)' },
  [MarketCurrencies.CAD]: { id: MarketCurrencies.CAD, label: 'Canadian Dollar (CAD)', symbol: '$', displayLabel: '$ Canadian Dollar (CAD)' },
  [MarketCurrencies.AUD]: { id: MarketCurrencies.AUD, label: 'Australian Dollar (AUD)', symbol: '$', displayLabel: '$ Australian Dollar (AUD)' },
  [MarketCurrencies.BRL]: { id: MarketCurrencies.BRL, label: 'Brazilian Real (BRL)', symbol: 'R$', displayLabel: 'R$ Brazilian Real (BRL)' },
  [MarketCurrencies.CHF]: { id: MarketCurrencies.CHF, label: 'Swiss Franc (CHF)', symbol: 'CHF', displayLabel: 'CHF Swiss Franc (CHF)' },
  [MarketCurrencies.CNY]: { id: MarketCurrencies.CNY, label: 'Chinese Yuan (CNY)', symbol: '¥', displayLabel: '¥ Chinese Yuan (CNY)' },
  [MarketCurrencies.CZK]: { id: MarketCurrencies.CZK, label: 'Czech Koruna (CZK)', symbol: 'Kc', displayLabel: 'Kc Czech Koruna (CZK)' },
  [MarketCurrencies.DKK]: { id: MarketCurrencies.DKK, label: 'Danish Krone (DKK)', symbol: 'kr', displayLabel: 'kr Danish Krone (DKK)' },
  [MarketCurrencies.EUR]: { id: MarketCurrencies.EUR, label: 'Euro (EUR)', symbol: '€', displayLabel: '€ Euro (EUR)' },
  [MarketCurrencies.GBP]: { id: MarketCurrencies.GBP, label: 'British Pound (GBP)', symbol: '£', displayLabel: '£ British Pound (GBP)' },
  [MarketCurrencies.HKD]: { id: MarketCurrencies.HKD, label: 'Hong Kong Dollar (HKD)', symbol: '$', displayLabel: '$ Hong Kong Dollar (HKD)' },
  [MarketCurrencies.HUF]: { id: MarketCurrencies.HUF, label: 'Hungarian Forint (HUF)', symbol: 'Ft', displayLabel: 'Ft Hungarian Forint (HUF)' },
  [MarketCurrencies.IDR]: { id: MarketCurrencies.IDR, label: 'Indonesian Rupiah (IDR)', symbol: 'Rp', displayLabel: 'Rp Indonesian Rupiah (IDR)' },
  [MarketCurrencies.ILS]: { id: MarketCurrencies.ILS, label: 'Israeli Shekel (ILS)', symbol: '₪', displayLabel: '₪ Israeli Shekel (ILS)' },
  [MarketCurrencies.INR]: { id: MarketCurrencies.INR, label: 'Indian Rupee (INR)', symbol: '₹', displayLabel: '₹ Indian Rupee (INR)' },
  [MarketCurrencies.JPY]: { id: MarketCurrencies.JPY, label: 'Japanese Yen (JPY)', symbol: '¥', displayLabel: '¥ Japanese Yen (JPY)' },
  [MarketCurrencies.KRW]: { id: MarketCurrencies.KRW, label: 'Korean Won (KRW)', symbol: '₩', displayLabel: '₩ Korean Won (KRW)' },
  [MarketCurrencies.MAD]: { id: MarketCurrencies.MAD, label: 'Moroccan Dirham (MAD)', symbol: 'DH', displayLabel: 'DH Moroccan Dirham (MAD)' },
  [MarketCurrencies.MXN]: { id: MarketCurrencies.MXN, label: 'Mexican Peso (MXN)', symbol: '$', displayLabel: '$ Mexican Peso (MXN)' },
  [MarketCurrencies.MYR]: { id: MarketCurrencies.MYR, label: 'Malaysian Ringgit (MYR)', symbol: 'RM', displayLabel: 'RM Malaysian Ringgit (MYR)' },
  [MarketCurrencies.NOK]: { id: MarketCurrencies.NOK, label: 'Norwegian Krone (NOK)', symbol: 'kr', displayLabel: 'kr Norwegian Krone (NOK)' },
  [MarketCurrencies.NZD]: { id: MarketCurrencies.NZD, label: 'New Zealand Dollar (NZD)', symbol: '$', displayLabel: '$ New Zealand Dollar (NZD)' },
  [MarketCurrencies.PHP]: { id: MarketCurrencies.PHP, label: 'Philippine Peso (PHP)', symbol: '₱', displayLabel: '₱ Philippine Peso (PHP)' },
  [MarketCurrencies.PLN]: { id: MarketCurrencies.PLN, label: 'Polish Zloty (PLN)', symbol: 'zl', displayLabel: 'zl Polish Zloty (PLN)' },
  [MarketCurrencies.SEK]: { id: MarketCurrencies.SEK, label: 'Swedish Krona (SEK)', symbol: 'kr', displayLabel: 'kr Swedish Krona (SEK)' },
  [MarketCurrencies.SGD]: { id: MarketCurrencies.SGD, label: 'Singapore Dollar (SGD)', symbol: '$', displayLabel: '$ Singapore Dollar (SGD)' },
  [MarketCurrencies.THB]: { id: MarketCurrencies.THB, label: 'Thai Baht (THB)', symbol: '฿', displayLabel: '฿ Thai Baht (THB)' },
  [MarketCurrencies.TRY]: { id: MarketCurrencies.TRY, label: 'Turkish Lira (TRY)', symbol: '₺', displayLabel: '₺ Turkish Lira (TRY)' },
  [MarketCurrencies.TWD]: { id: MarketCurrencies.TWD, label: 'Taiwan New Dollar (TWD)', symbol: 'NT$', displayLabel: 'NT$ Taiwan New Dollar (TWD)' },
  [MarketCurrencies.VND]: { id: MarketCurrencies.VND, label: 'Vietnamese Dong (VND)', symbol: '₫', displayLabel: '₫ Vietnamese Dong (VND)' },
  [MarketCurrencies.ZAR]: { id: MarketCurrencies.ZAR, label: 'South African Rand (ZAR)', symbol: 'R', displayLabel: 'R South African Rand (ZAR)' },
}

const languageOptionById: Record<MarketLanguages, LanguageOption> = {
  [MarketLanguages.EN]: { id: MarketLanguages.EN, label: 'English (US)' },
  [MarketLanguages.LA]: { id: MarketLanguages.LA, label: 'Latin (LA)' },
  [MarketLanguages.FR]: { id: MarketLanguages.FR, label: 'Français (FR)' },
}

export const defaultCurrencyOption = currencyOptionById[MARKET_CONFIG.BASE_CURRENCY]
export const defaultLanguageOption = languageOptionById[MARKET_CONFIG.BASE_LANGUAGE]

export function toCurrencyOption(currency: MarketCurrencies): CurrencyOption {
  return currencyOptionById[currency]
}

export function localeToLanguageOption(locale: string): LanguageOption | undefined {
  const languageCode = locale.split('-')[0]?.toLowerCase()

  if (languageCode === MarketLanguages.EN) {
    return languageOptionById[MarketLanguages.EN]
  }

  if (languageCode === MarketLanguages.FR) {
    return languageOptionById[MarketLanguages.FR]
  }

  if (languageCode === MarketLanguages.LA) {
    return languageOptionById[MarketLanguages.LA]
  }

  return undefined
}
