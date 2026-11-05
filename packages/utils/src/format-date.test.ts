import { describe, expect, it } from 'vitest'
import { formatShortDateTime } from './format-date'

describe('formatShortDateTime', () => {
  it('formats a Date in local time', () => {
    expect(formatShortDateTime(new Date(2026, 10, 5, 15, 7))).toBe('Nov 5, 3:07pm')
  })

  it('formats the same instant given as an ISO string', () => {
    const date = new Date(2026, 10, 5, 15, 7)
    expect(formatShortDateTime(date.toISOString())).toBe('Nov 5, 3:07pm')
  })

  it('formats a morning time with a two-digit minute', () => {
    expect(formatShortDateTime(new Date(2026, 0, 1, 9, 5))).toBe('Jan 1, 9:05am')
  })

  it('returns an empty string for missing or invalid values', () => {
    expect(formatShortDateTime(undefined)).toBe('')
    expect(formatShortDateTime(null)).toBe('')
    expect(formatShortDateTime('')).toBe('')
    expect(formatShortDateTime('not-a-date')).toBe('')
  })
})
