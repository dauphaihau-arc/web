import { describe, expect, it } from 'vitest';
import { UTC_TIMEZONE } from '~/shared/ui/date-filter/date-filter-timezone';
import {
  buildTransactionsDateRange,
  createDefaultTransactionsDateFilter,
} from './transactions-date-filter';

describe('transactions date filter', () => {
  it('defaults to UTC to match the UTC-rendered Date column', () => {
    expect(createDefaultTransactionsDateFilter().timezone).toBe(UTC_TIMEZONE);
  });

  it('turns a UTC day selection into UTC day boundaries', () => {
    const filter = {
      ...createDefaultTransactionsDateFilter(),
      operator: 'eq' as const,
      date: new Date(2026, 9, 20, 12, 0, 0),
    };

    expect(buildTransactionsDateRange(filter)).toEqual({
      from: '2026-10-20T00:00:00.000Z',
      to: '2026-10-20T23:59:59.999Z',
    });
  });
});
