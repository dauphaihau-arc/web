import { describe, expect, it } from 'vitest';
import {
  MarketCurrencies,
  MarketLanguages,
  MarketRegions,
} from '@arc/enums/market';
import { sanitizeMarketPreferences } from './market-preferences';

const basePreferences = {
  currency: MarketCurrencies.USD,
  region: MarketRegions.UNITED_STATES,
};

describe('sanitizeMarketPreferences', () => {
  it('accepts Vietnamese and the legacy language values', () => {
    for (const language of [MarketLanguages.VI, MarketLanguages.LA, MarketLanguages.FR]) {
      expect(sanitizeMarketPreferences({ ...basePreferences, language })).toEqual({
        ...basePreferences,
        language,
      });
    }
  });

  it('rejects an unknown language value', () => {
    expect(sanitizeMarketPreferences({
      ...basePreferences,
      language: 'xx' as MarketLanguages,
    })).toBeNull();
  });
});
