import { LocalStorageKeys } from '@arc/enums/local-storage-keys'
import {
  MARKET_CONFIG,
  MarketCurrencies,
  MarketLanguages,
  MarketRegions,
} from '@arc/enums/market'
import type { AuthPreferences } from '~/shared/api/auth/contracts/auth-user.contract'

export const GUEST_PREFERENCES_COOKIE_KEY = LocalStorageKeys.GUEST_PREFERENCES

export function getFallbackMarketPreferences(): AuthPreferences {
  return {
    currency: MARKET_CONFIG.BASE_CURRENCY,
    language: MARKET_CONFIG.BASE_LANGUAGE,
    region: MARKET_CONFIG.BASE_REGION,
  }
}

export function sanitizeMarketPreferences(
  preferences?: Partial<AuthPreferences> | null,
): AuthPreferences | null {
  if (!preferences) {
    return null
  }

  const currency = preferences.currency as MarketCurrencies | undefined
  const language = preferences.language as MarketLanguages | undefined
  const region = preferences.region as MarketRegions | undefined

  if (
    !currency
    || !language
    || !region
    || !Object.values(MarketCurrencies).includes(currency)
    || !Object.values(MarketLanguages).includes(language)
    || !Object.values(MarketRegions).includes(region)
  ) {
    return null
  }

  return {
    currency,
    language,
    region,
  }
}
