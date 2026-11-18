import { describe, expect, it } from 'vitest';
import { MarketCurrencies } from '@arc/enums/market';
import formatCurrency from '@arc/utils/format-currency';
import {
  formatLocaleDate,
  formatLocaleNumber,
  resolveFormattingLocale,
} from './locale-format';

const UTC_NOON = '2026-11-18T12:00:00Z';
const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
};

describe('resolveFormattingLocale', () => {
  it('composes the Storefront Language with the Market region', () => {
    expect(resolveFormattingLocale('vi', 'Vietnam')).toBe('vi-VN');
    expect(resolveFormattingLocale('en', 'United States')).toBe('en-US');
  });

  it('keeps the language when the market region is unknown', () => {
    expect(resolveFormattingLocale('vi', undefined)).toBe('vi');
    expect(resolveFormattingLocale(undefined, 'Vietnam')).toBe('en-VN');
  });
});

describe('formatLocaleDate', () => {
  it('formats the same instant differently per composed locale', () => {
    const en = formatLocaleDate(UTC_NOON, 'en-US', DATE_OPTIONS);
    const vi = formatLocaleDate(UTC_NOON, 'vi-VN', DATE_OPTIONS);

    expect(en).toBe('Nov 18, 2026');
    expect(vi).not.toBe(en);
    expect(vi).toContain('2026');
    expect(vi).toContain('11');
  });

  it('returns an empty string for a missing or invalid date', () => {
    expect(formatLocaleDate(undefined, 'vi-VN')).toBe('');
    expect(formatLocaleDate('not-a-date', 'vi-VN')).toBe('');
  });
});

describe('formatLocaleNumber', () => {
  it('uses the composed locale grouping and decimal separators', () => {
    expect(formatLocaleNumber(1234567.89, 'en-US')).toBe('1,234,567.89');
    expect(formatLocaleNumber(1234567.89, 'vi-VN')).toBe('1.234.567,89');
  });
});

describe('money stays currency-scoped', () => {
  it('keeps the existing currency formatter independent of the display locale', () => {
    expect(formatCurrency(1234.5, MarketCurrencies.USD)).toBe('$1,234.50');
    expect(formatCurrency(1234, MarketCurrencies.VND)).toBe('₫1,234');

    // A Vietnamese UI still shows the currency the buyer is charged in; the
    // locale only affects dates and plain numbers.
    expect(formatLocaleNumber(1234.5, 'vi-VN')).toBe('1.234,5');
    expect(formatCurrency(1234.5, MarketCurrencies.USD)).not.toBe('$1.234,50');
  });
});
