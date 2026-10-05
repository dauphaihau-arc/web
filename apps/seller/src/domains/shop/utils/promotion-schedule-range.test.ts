import { describe, expect, it } from 'vitest';
import { addDurationToLocal, localToInstant } from './promotion-schedule-range';

describe('promotion-schedule-range', () => {
  it('resolves a wall clock to its instant in the store timezone', () => {
    expect(localToInstant('2026-07-01T10:00', 'America/New_York'))
      .toEqual(new Date('2026-07-01T14:00:00.000Z'));
  });

  it('resolves a repeated wall clock to the earlier occurrence', () => {
    expect(localToInstant('2026-11-01T01:30', 'America/New_York'))
      .toEqual(new Date('2026-11-01T05:30:00.000Z'));
  });

  it('has no instant for an empty timezone or malformed wall clock', () => {
    expect(localToInstant('2026-07-01T10:00', '')).toBeUndefined();
    expect(localToInstant('', 'America/New_York')).toBeUndefined();
    expect(localToInstant('not-a-date', 'America/New_York')).toBeUndefined();
  });

  it('adds a duration and re-reads the store wall clock', () => {
    expect(addDurationToLocal('2026-07-01T10:00', 'America/New_York', 24, 'hour'))
      .toBe('2026-07-02T10:00');
    expect(addDurationToLocal('2026-07-01T10:00', 'America/New_York', 30, 'day'))
      .toBe('2026-07-31T10:00');
  });

  it('keeps the correct store wall clock across a daylight-saving change', () => {
    // 01:30 EST is 06:30 UTC; one hour later is 07:30 UTC, i.e. 03:30 EDT.
    expect(addDurationToLocal('2026-03-08T01:30', 'America/New_York', 1, 'hour'))
      .toBe('2026-03-08T03:30');
  });

  it('reads a fixed instant in the store timezone rather than UTC', () => {
    // 2026-07-01T00:30Z is still 2026-06-30 in New York.
    expect(addDurationToLocal('2026-06-30T20:30', 'America/New_York', 0, 'minute'))
      .toBe('2026-06-30T20:30');
  });
});
