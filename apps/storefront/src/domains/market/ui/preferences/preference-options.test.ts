import { describe, expect, it } from 'vitest';
import { MarketLanguages } from '@arc/enums/market';
import {
  defaultLanguageOption,
  localeToLanguageOption,
} from './preference-options';

describe('localeToLanguageOption', () => {
  it('maps both Vietnamese locales to the Vietnamese Storefront Language', () => {
    expect(localeToLanguageOption('vi-VN')).toEqual({
      id: MarketLanguages.VI,
      label: 'Tiếng Việt',
    });
    expect(localeToLanguageOption('vi-US')).toEqual({
      id: MarketLanguages.VI,
      label: 'Tiếng Việt',
    });
  });

  it('keeps the existing language mappings', () => {
    expect(localeToLanguageOption('en-US')?.id).toBe(MarketLanguages.EN);
    expect(localeToLanguageOption('fr-FR')?.id).toBe(MarketLanguages.FR);
    expect(localeToLanguageOption('la-LA')?.id).toBe(MarketLanguages.LA);
  });

  it('returns undefined for an unsupported locale', () => {
    expect(localeToLanguageOption('ja-JP')).toBeUndefined();
  });

  it('keeps English as the base language option', () => {
    expect(defaultLanguageOption.id).toBe(MarketLanguages.EN);
  });
});
