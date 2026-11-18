import { describe, expect, it } from 'vitest';
import {
  MarketCurrencies,
  MarketRegions,
  StorefrontLanguages,
} from '@arc/enums/market';
import type { AuthPreferences } from '~/domains/auth/api/contracts/auth-user.contract';
import { sanitizeMarketPreferences } from './market-preferences';

const basePreferences = {
  currency: MarketCurrencies.USD,
  region: MarketRegions.UNITED_STATES,
};

describe('sanitizeMarketPreferences', () => {
  it('accepts English and Vietnamese', () => {
    for (const language of [StorefrontLanguages.EN, StorefrontLanguages.VI]) {
      expect(sanitizeMarketPreferences({ ...basePreferences, language })).toEqual({
        ...basePreferences,
        language,
      });
    }
  });

  it('migrates legacy la/fr languages to English, preserving region and currency', () => {
    const preferences = {
      currency: MarketCurrencies.VND,
      region: MarketRegions.VIET_NAM,
    };

    for (const language of ['la', 'fr']) {
      const stored = { ...preferences, language } as unknown as Partial<AuthPreferences>;

      expect(sanitizeMarketPreferences(stored)).toEqual({
        ...preferences,
        language: StorefrontLanguages.EN,
      });
    }
  });

  it('rejects an unknown language value', () => {
    expect(sanitizeMarketPreferences({
      ...basePreferences,
      language: 'xx' as StorefrontLanguages,
    })).toBeNull();
  });
});
