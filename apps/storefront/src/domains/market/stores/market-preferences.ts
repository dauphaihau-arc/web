import { LocalStorageKeys } from '@arc/enums/local-storage-keys';
import {
  MARKET_CONFIG,
  MarketCurrencies,
  MarketRegions,
  StorefrontLanguages,
} from '@arc/enums/market';
import type { AuthPreferences } from '~/domains/auth/api/contracts/auth-user.contract';

export const GUEST_PREFERENCES_COOKIE_KEY = LocalStorageKeys.GUEST_PREFERENCES;

/**
 * Languages stored by older storefront versions. They are no longer selectable;
 * guests who still carry one fall back to English while keeping the region and
 * currency they chose.
 */
const LEGACY_LANGUAGE_MIGRATIONS: Record<string, StorefrontLanguages | undefined> = {
  la: StorefrontLanguages.EN,
  fr: StorefrontLanguages.EN,
};

function normalizeStorefrontLanguage(language: string): StorefrontLanguages | undefined {
  return LEGACY_LANGUAGE_MIGRATIONS[language] ??
    Object.values(StorefrontLanguages).find(value => value === language);
}

export function getFallbackMarketPreferences(): AuthPreferences {
  return {
    currency: MARKET_CONFIG.BASE_CURRENCY,
    language: MARKET_CONFIG.BASE_LANGUAGE,
    region: MARKET_CONFIG.BASE_REGION,
  };
}

export function sanitizeMarketPreferences(
  preferences?: Partial<AuthPreferences> | null,
): AuthPreferences | null {
  if (!preferences) {
    return null;
  }

  const currency = preferences.currency as MarketCurrencies | undefined;
  const language = preferences.language;
  const region = preferences.region as MarketRegions | undefined;
  const normalizedLanguage = language
    ? normalizeStorefrontLanguage(language)
    : undefined;

  if (
    !currency
    || !normalizedLanguage
    || !region
    || !Object.values(MarketCurrencies).includes(currency)
    || !Object.values(MarketRegions).includes(region)
  ) {
    return null;
  }

  return {
    currency,
    language: normalizedLanguage,
    region,
  };
}
