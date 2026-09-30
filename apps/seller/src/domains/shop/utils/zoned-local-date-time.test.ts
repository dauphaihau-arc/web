import { describe, expect, it } from 'vitest';
import {
  localDateTimeCandidates,
  offsetMinutesForInstant,
  parseLocalDateTime,
} from './zoned-local-date-time';

describe('zoned-local-date-time', () => {
  it('resolves an ordinary local time to a single instant', () => {
    const parts = parseLocalDateTime('2026-07-01T10:00');

    expect(parts).toBeDefined();
    expect(localDateTimeCandidates(parts!, 'America/New_York')).toEqual([
      new Date('2026-07-01T14:00:00.000Z'),
    ]);
  });

  it('reports no instant for a spring-forward local time', () => {
    expect(
      localDateTimeCandidates(
        parseLocalDateTime('2026-03-08T02:30')!,
        'America/New_York',
      ),
    ).toEqual([]);
  });

  it('reports both instants for a fall-back local time', () => {
    expect(
      localDateTimeCandidates(
        parseLocalDateTime('2026-11-01T01:30')!,
        'America/New_York',
      ),
    ).toEqual([
      new Date('2026-11-01T05:30:00.000Z'),
      new Date('2026-11-01T06:30:00.000Z'),
    ]);
  });

  it('derives the UTC offset of an instant in the selected timezone', () => {
    expect(
      offsetMinutesForInstant(new Date('2026-11-01T05:30:00.000Z'), 'America/New_York'),
    ).toBe(-240);
    expect(
      offsetMinutesForInstant(new Date('2026-11-01T06:30:00.000Z'), 'America/New_York'),
    ).toBe(-300);
  });

  it('rejects values that are not local wall clocks', () => {
    expect(parseLocalDateTime('2026-11-01 01:30')).toBeUndefined();
    expect(parseLocalDateTime('2026-11-01T25:00')).toBeUndefined();
  });
});
