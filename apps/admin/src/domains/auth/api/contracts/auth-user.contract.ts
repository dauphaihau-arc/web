import type { components } from '@arc/schemas/api/generated/openapi';

export type AuthPreferences = components['schemas']['MePreferencesResponseDto'];

export type AuthUser = components['schemas']['MeResponseDto'];

export type AuthUserEnvelope = components['schemas']['AuthUserResponseDto'];

export type CurrentUser = components['schemas']['CurrentUserResponseDto'];

export type CurrentUserEnvelope = {
  user: CurrentUser
};
