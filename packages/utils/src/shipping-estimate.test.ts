import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatShippingEstimateRange } from './shipping-estimate'

describe('formatShippingEstimateRange', () => {
  beforeEach(() => {
    // The formatter omits the current year, so the clock is pinned for a stable
    // expectation instead of depending on when the suite runs.
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-22T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('states a same-month window once, without the current year', () => {
    expect(formatShippingEstimateRange({
      earliest_delivery_date: '2026-09-26T00:00:00.000Z',
      latest_delivery_date: '2026-09-30T00:00:00.000Z',
    })).toBe('Sep 26 - 30')
  })

  it('names each month of a window that spans two months', () => {
    expect(formatShippingEstimateRange({
      earliest_delivery_date: '2026-09-26T00:00:00.000Z',
      latest_delivery_date: '2026-10-09T00:00:00.000Z',
    })).toBe('Sep 26 - Oct 9')
  })

  it('collapses an identical earliest and latest day', () => {
    expect(formatShippingEstimateRange({
      earliest_delivery_date: new Date('2026-09-26T00:00:00.000Z'),
      latest_delivery_date: new Date('2026-09-26T00:00:00.000Z'),
    })).toBe('Sep 26')
  })

  it('keeps a year that is not the current one', () => {
    expect(formatShippingEstimateRange({
      earliest_delivery_date: '2027-09-26T00:00:00.000Z',
      latest_delivery_date: '2027-09-30T00:00:00.000Z',
    })).toBe('Sep 26 - 30, 2027')
  })

  it('keeps both years when the window crosses a year boundary', () => {
    expect(formatShippingEstimateRange({
      earliest_delivery_date: '2026-12-28T00:00:00.000Z',
      latest_delivery_date: '2027-01-03T00:00:00.000Z',
    })).toBe('Dec 28, 2026 - Jan 3, 2027')
  })

  it('renders nothing rather than inventing an estimate from invalid input', () => {
    expect(formatShippingEstimateRange()).toBe('')
    expect(formatShippingEstimateRange({
      earliest_delivery_date: 'not-a-date',
      latest_delivery_date: '2026-09-30T00:00:00.000Z',
    })).toBe('')
  })
})
