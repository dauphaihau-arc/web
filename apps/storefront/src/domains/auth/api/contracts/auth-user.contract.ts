import type { components } from '@arc/schemas/api/generated/openapi';

export type AuthPreferences = components['schemas']['MePreferencesResponseDto'];

export type AuthShop = components['schemas']['MeShopResponseDto'];

export type AuthUser = components['schemas']['MeResponseDto'];

export type AuthUserEnvelope = components['schemas']['AuthUserResponseDto'];

export type CurrentUserShop = components['schemas']['CurrentUserShopResponseDto'];

export type CurrentUser = components['schemas']['CurrentUserResponseDto'];

export type CurrentUserEnvelope = {
  user: CurrentUser
};

// Backward-compatible alias while callers migrate to AuthUser.
export type UserAuthenticated = AuthUser;
