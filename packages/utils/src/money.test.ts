import { describe, expect, it } from 'vitest'
import { MarketCurrencies } from '@arc/enums/market'
import { formatMinorCurrency, fromMinorUnits, toMinorUnits } from './money'

describe('money utilities', () => {
  it('converts minor units for two-decimal currencies', () => {
    expect(fromMinorUnits(1234, MarketCurrencies.USD)).toBe(12.34)
    expect(toMinorUnits(12.34, MarketCurrencies.USD)).toBe(1234)
  })

  it('keeps zero-decimal currencies unscaled', () => {
    expect(fromMinorUnits(1200, MarketCurrencies.JPY)).toBe(1200)
    expect(toMinorUnits(1200, MarketCurrencies.JPY)).toBe(1200)
  })

  it('formats minor currency values with the correct currency display', () => {
    expect(formatMinorCurrency(1234, MarketCurrencies.USD)).toBe('$12.34')
    expect(formatMinorCurrency(1100, MarketCurrencies.EUR)).toBe('€11.00')
    expect(formatMinorCurrency(1200, MarketCurrencies.VND)).toBe('₫1,200')
  })
})
