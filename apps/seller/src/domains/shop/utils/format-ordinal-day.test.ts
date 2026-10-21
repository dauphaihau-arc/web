import { describe, expect, it } from 'vitest';
import { formatOrdinalDay } from './format-ordinal-day';

describe('formatOrdinalDay', () => {
  it('uses the st suffix for days ending in one except the teens', () => {
    expect(formatOrdinalDay(1)).toBe('1st');
    expect(formatOrdinalDay(11)).toBe('11th');
    expect(formatOrdinalDay(21)).toBe('21st');
    expect(formatOrdinalDay(31)).toBe('31st');
  });

  it('uses the nd suffix for days ending in two except the teens', () => {
    expect(formatOrdinalDay(2)).toBe('2nd');
    expect(formatOrdinalDay(12)).toBe('12th');
    expect(formatOrdinalDay(22)).toBe('22nd');
  });

  it('uses the rd suffix for days ending in three except the teens', () => {
    expect(formatOrdinalDay(3)).toBe('3rd');
    expect(formatOrdinalDay(13)).toBe('13th');
    expect(formatOrdinalDay(23)).toBe('23rd');
  });

  it('uses the th suffix for every other day', () => {
    expect(formatOrdinalDay(15)).toBe('15th');
    expect(formatOrdinalDay(30)).toBe('30th');
  });
});
