import { describe, expect, it } from 'vitest';
import { StorefrontLanguages } from '@arc/enums/market';
import {
  defaultLanguageOption,
  localeToLanguageOption,
  urlLocaleToFormLanguage,
} from './preference-options';

describe('localeToLanguageOption', () => {
  it('maps both Vietnamese locales to the Vietnamese Storefront Language', () => {
    expect(localeToLanguageOption('vi-VN')).toEqual({
      id: StorefrontLanguages.VI,
      label: 'Tiếng Việt',
    });
    expect(localeToLanguageOption('vi-US')).toEqual({
      id: StorefrontLanguages.VI,
      label: 'Tiếng Việt',
    });
  });

  it('maps English locales to the English Storefront Language', () => {
    expect(localeToLanguageOption('en-US')?.id).toBe(StorefrontLanguages.EN);
  });

  it('returns undefined for an unsupported locale', () => {
    expect(localeToLanguageOption('ja-JP')).toBeUndefined();
  });

  it('keeps English as the base language option', () => {
    expect(defaultLanguageOption.id).toBe(StorefrontLanguages.EN);
  });
});

describe('urlLocaleToFormLanguage', () => {
  it('maps the URL locale to the language shown in the preferences form', () => {
    expect(urlLocaleToFormLanguage('vi-VN')).toBe(StorefrontLanguages.VI);
    expect(urlLocaleToFormLanguage('en-US')).toBe(StorefrontLanguages.EN);
  });

  it('falls back to the base language for an unsupported URL locale', () => {
    expect(urlLocaleToFormLanguage('ja-JP')).toBe(defaultLanguageOption.id);
  });
});
