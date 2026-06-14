import { ProductWhoMade } from '@arc/enums/product'
import { MarketCurrencies } from '@arc/enums/market'

export type PricePresetId =
  | 'all'
  | 'under_200'
  | '200_500'
  | '500_1000'
  | 'over_1000'
  | 'custom'

// These keys intentionally mirror existing route/query parameter names.

export type AttributeFilter = {
  facetKey: string
  attributeName: string
  selectedOptionKeys: string[]
  selectedOptionValues: string[]
}

export type ProductFilterState = {
  isDigital: string
  price: PricePresetId
  minPrice: string
  maxPrice: string
  whoMade: string
  attributeFilters: AttributeFilter[]
}

export const isDigitalOpts = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Digital' },
  { value: 'false', label: 'Physical' },
]

export const productWhoMadeOpts = [
  {
    value: 'all',
    label: 'All',
  },
  {
    value: ProductWhoMade.I_DID,
    label: 'Handmade',
  },
]

export type PricePresetRange = {
  value: Exclude<PricePresetId, 'all' | 'custom'>
  min?: number
  max?: number
}

const DEFAULT_PRICE_PRESET_RANGES: PricePresetRange[] = [
  { value: 'under_200', max: 200 },
  { value: '200_500', min: 200, max: 500 },
  { value: '500_1000', min: 500, max: 1000 },
  { value: 'over_1000', min: 1000 },
]

const USD_LIKE_PRICE_PRESET_RANGES: PricePresetRange[] = [
  { value: 'under_200', max: 25 },
  { value: '200_500', min: 25, max: 50 },
  { value: '500_1000', min: 50, max: 100 },
  { value: 'over_1000', min: 100 },
]

const JPY_LIKE_PRICE_PRESET_RANGES: PricePresetRange[] = [
  { value: 'under_200', max: 2_000 },
  { value: '200_500', min: 2_000, max: 5_000 },
  { value: '500_1000', min: 5_000, max: 10_000 },
  { value: 'over_1000', min: 10_000 },
]

const KRW_LIKE_PRICE_PRESET_RANGES: PricePresetRange[] = [
  { value: 'under_200', max: 20_000 },
  { value: '200_500', min: 20_000, max: 50_000 },
  { value: '500_1000', min: 50_000, max: 100_000 },
  { value: 'over_1000', min: 100_000 },
]

const VND_PRICE_PRESET_RANGES: PricePresetRange[] = [
  { value: 'under_200', max: 200_000 },
  { value: '200_500', min: 200_000, max: 500_000 },
  { value: '500_1000', min: 500_000, max: 1_000_000 },
  { value: 'over_1000', min: 1_000_000 },
]

const HUF_PRICE_PRESET_RANGES: PricePresetRange[] = [
  { value: 'under_200', max: 2_000 },
  { value: '200_500', min: 2_000, max: 5_000 },
  { value: '500_1000', min: 5_000, max: 10_000 },
  { value: 'over_1000', min: 10_000 },
]

const INR_PRICE_PRESET_RANGES: PricePresetRange[] = [
  { value: 'under_200', max: 2_000 },
  { value: '200_500', min: 2_000, max: 5_000 },
  { value: '500_1000', min: 5_000, max: 10_000 },
  { value: 'over_1000', min: 10_000 },
]

function assignPresetRanges(
  currencies: MarketCurrencies[],
  ranges: PricePresetRange[],
): Partial<Record<MarketCurrencies, PricePresetRange[]>> {
  return Object.fromEntries(currencies.map(currency => [currency, ranges]))
}

export const PRICE_PRESET_RANGES_BY_CURRENCY: Partial<Record<MarketCurrencies, PricePresetRange[]>> = {
  ...assignPresetRanges([
    MarketCurrencies.USD,
    MarketCurrencies.AUD,
    MarketCurrencies.CAD,
    MarketCurrencies.CHF,
    MarketCurrencies.EUR,
    MarketCurrencies.GBP,
    MarketCurrencies.NZD,
    MarketCurrencies.SGD,
  ], USD_LIKE_PRICE_PRESET_RANGES),
  ...assignPresetRanges([
    MarketCurrencies.BRL,
    MarketCurrencies.CNY,
    MarketCurrencies.CZK,
    MarketCurrencies.DKK,
    MarketCurrencies.HKD,
    MarketCurrencies.ILS,
    MarketCurrencies.MAD,
    MarketCurrencies.MXN,
    MarketCurrencies.MYR,
    MarketCurrencies.NOK,
    MarketCurrencies.PHP,
    MarketCurrencies.PLN,
    MarketCurrencies.SEK,
    MarketCurrencies.THB,
    MarketCurrencies.TRY,
    MarketCurrencies.TWD,
    MarketCurrencies.ZAR,
  ], DEFAULT_PRICE_PRESET_RANGES),
  ...assignPresetRanges([MarketCurrencies.HUF], HUF_PRICE_PRESET_RANGES),
  ...assignPresetRanges([MarketCurrencies.IDR], VND_PRICE_PRESET_RANGES),
  ...assignPresetRanges([MarketCurrencies.INR], INR_PRICE_PRESET_RANGES),
  ...assignPresetRanges([MarketCurrencies.JPY], JPY_LIKE_PRICE_PRESET_RANGES),
  ...assignPresetRanges([MarketCurrencies.KRW], KRW_LIKE_PRICE_PRESET_RANGES),
  ...assignPresetRanges([MarketCurrencies.VND], VND_PRICE_PRESET_RANGES),
}

export function getPricePresetRanges(currency: string): PricePresetRange[] {
  return PRICE_PRESET_RANGES_BY_CURRENCY[currency as MarketCurrencies]
    ?? DEFAULT_PRICE_PRESET_RANGES
}
