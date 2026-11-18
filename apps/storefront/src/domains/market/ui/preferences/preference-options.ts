import { MARKET_CONFIG, MarketLanguages } from '@arc/enums/market';
import type { MarketCurrencies, MarketRegions } from '@arc/enums/market';

export type LanguageOption = {
  id: MarketLanguages
  label: string
};

export type PreferenceState = {
  region: MarketRegions
  language: MarketLanguages
  currency: MarketCurrencies
};

const languageOptionById: Record<MarketLanguages, LanguageOption> = {
  [MarketLanguages.EN]: { id: MarketLanguages.EN, label: 'English (US)' },
  [MarketLanguages.LA]: { id: MarketLanguages.LA, label: 'Latin (LA)' },
  [MarketLanguages.FR]: { id: MarketLanguages.FR, label: 'Français (FR)' },
  [MarketLanguages.VI]: { id: MarketLanguages.VI, label: 'Tiếng Việt' },
};

const languageOptionByCode = new Map(
  Object.values(languageOptionById).map(option => [option.id, option]),
);

export const defaultLanguageOption = languageOptionById[MARKET_CONFIG.BASE_LANGUAGE];

export function localeToLanguageOption(locale: string): LanguageOption | undefined {
  const languageCode = locale.split('-')[0]?.toLowerCase();

  return languageCode
    ? languageOptionByCode.get(languageCode as MarketLanguages)
    : undefined;
}

/**
 * Maps the locale currently rendered by the URL to the language shown in the
 * preferences form. The URL is the source of truth while a dialog is open, so
 * a stale stored preference must never win over it.
 */
export function urlLocaleToFormLanguage(locale: string): MarketLanguages {
  return localeToLanguageOption(locale)?.id ?? defaultLanguageOption.id;
}

/**
 * Keeps the URL language selectable even when the selected market does not
 * advertise it, so the form can always mirror the rendered locale.
 */
export function withUrlLanguageOption(
  options: LanguageOption[],
  locale: string,
): LanguageOption[] {
  const urlOption = localeToLanguageOption(locale);

  if (!urlOption || options.some(option => option.id === urlOption.id)) {
    return options;
  }

  return [...options, urlOption];
}
