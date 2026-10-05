import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { formatScheduleDateRange, formatScheduleDateTime } from './format-schedule-range';

describe('format-schedule-date-range', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hoists the month when both ends share it in the current year', () => {
    expect(
      formatScheduleDateRange(
        '2026-10-15T04:59:00.000Z',
        '2026-10-23T04:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15 – 23');
  });

  it('prints one date when both ends fall on the same day', () => {
    expect(
      formatScheduleDateRange(
        '2026-10-15T04:59:00.000Z',
        '2026-10-15T16:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15');
  });

  it('hoists the year when the ends span months in a past year', () => {
    expect(
      formatScheduleDateRange(
        '2025-10-15T04:59:00.000Z',
        '2025-11-03T04:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15 – Nov 3, 2025');
  });

  it('shows a date range without the time of day', () => {
    expect(
      formatScheduleDateRange(
        '2026-10-15T04:59:00.000Z',
        '2026-10-23T16:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15 – 23');
  });

  it('shows both years when the ends fall in different years', () => {
    expect(
      formatScheduleDateRange(
        '2026-10-04T13:57:00.000Z',
        '2027-01-04T13:57:00.000Z',
        'America/New_York',
      ),
    ).toBe('Oct 4, 2026 – Jan 4, 2027');
  });

  it('decides the current year in the schedule timezone, not the machine one', () => {
    const start = '2026-12-31T17:00:00.000Z';
    const end = '2027-01-05T17:00:00.000Z';

    expect(formatScheduleDateRange(start, end, 'Asia/Saigon')).toBe('Jan 1 – 6, 2027');
  });
});

describe('format-schedule-date-time', () => {
  it('renders the full wall-clock stamp in the schedule timezone', () => {
    expect(
      formatScheduleDateTime('2026-10-04T13:57:00.000Z', 'America/New_York'),
    ).toBe('Oct 4, 2026, 09:57');
  });

  it('renders each endpoint of a schedule in its authored timezone', () => {
    expect(
      formatScheduleDateTime('2027-01-04T13:57:00.000Z', 'America/New_York'),
    ).toBe('Jan 4, 2027, 08:57');
  });
});
