import type { components } from '@arc/schemas/api/generated/openapi';
import type { MarketCurrencies, MarketLanguages, MarketRegions } from '@arc/enums/market';

type ApiPreferences = components['schemas']['MePreferencesResponseDto'];
type ApiAuthUser = components['schemas']['MeResponseDto'];
type ApiAuthUserEnvelope = components['schemas']['AuthUserResponseDto'];
type ApiCurrentUser = components['schemas']['CurrentUserResponseDto'];

export type AuthPreferences =
  Omit<ApiPreferences, 'region' | 'language' | 'currency'> & {
    region: MarketRegions
    language: MarketLanguages
    currency: MarketCurrencies
  };

export type AuthUser = Omit<ApiAuthUser, 'preferences'> & {
  preferences?: AuthPreferences
};

export type AuthUserEnvelope = Omit<ApiAuthUserEnvelope, 'user'> & {
  user: AuthUser
};

export type CurrentUser = Omit<ApiCurrentUser, 'preferences'> & {
  preferences?: AuthPreferences
};

export type CurrentUserEnvelope = {
  user: CurrentUser
};
