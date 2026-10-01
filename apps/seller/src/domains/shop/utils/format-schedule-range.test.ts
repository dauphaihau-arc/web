import {
  afterEach, beforeEach, describe, expect, it, vi,
} from 'vitest';
import { formatScheduleRange } from './format-schedule-range';

describe('format-schedule-range', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hoists the month, year and time when both ends share them', () => {
    expect(
      formatScheduleRange(
        '2026-10-15T04:59:00.000Z',
        '2026-10-23T04:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15 – 23, 11:59');
  });

  it('prints one date and both times when the ends fall on the same day', () => {
    expect(
      formatScheduleRange(
        '2026-10-15T04:59:00.000Z',
        '2026-10-15T16:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15, 11:59 – 23:59');
  });

  it('keeps both times when the ends differ in time of day', () => {
    expect(
      formatScheduleRange(
        '2026-10-15T04:59:00.000Z',
        '2026-10-23T16:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15, 11:59 – 23, 23:59');
  });

  it('hoists the year when the ends span months but share the time', () => {
    expect(
      formatScheduleRange(
        '2026-10-15T04:59:00.000Z',
        '2026-11-03T04:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15 – Nov 3, 11:59');
  });

  it('keeps both dates when the ends span months and differ in time', () => {
    expect(
      formatScheduleRange(
        '2026-10-15T04:59:00.000Z',
        '2026-11-03T16:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15, 11:59 – Nov 3, 23:59');
  });

  it('shows both years when the ends fall in different years', () => {
    expect(
      formatScheduleRange(
        '2025-12-30T04:59:00.000Z',
        '2026-01-02T04:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Dec 30, 2025, 11:59 – Jan 2, 2026, 11:59');
  });

  it('shows the year for a schedule outside the current year', () => {
    expect(
      formatScheduleRange(
        '2025-10-15T04:59:00.000Z',
        '2025-10-23T04:59:00.000Z',
        'Asia/Saigon',
      ),
    ).toBe('Oct 15 – 23, 2025, 11:59');
  });

  it('decides the current year in the schedule timezone, not the machine one', () => {
    const start = '2026-12-31T17:00:00.000Z';
    const end = '2027-01-05T17:00:00.000Z';

    expect(formatScheduleRange(start, end, 'Asia/Saigon')).toBe('Jan 1 – 6, 2027, 00:00');
    expect(formatScheduleRange(start, end, 'UTC')).toBe(
      'Dec 31, 2026, 17:00 – Jan 5, 2027, 17:00',
    );
  });
});
