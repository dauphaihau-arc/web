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
};

export const defaultLanguageOption = languageOptionById[MARKET_CONFIG.BASE_LANGUAGE];

export function localeToLanguageOption(locale: string): LanguageOption | undefined {
  const languageCode = locale.split('-')[0]?.toLowerCase();

  if (languageCode === MarketLanguages.EN) {
    return languageOptionById[MarketLanguages.EN];
  }

  if (languageCode === MarketLanguages.FR) {
    return languageOptionById[MarketLanguages.FR];
  }

  if (languageCode === MarketLanguages.LA) {
    return languageOptionById[MarketLanguages.LA];
  }

  return undefined;
}
