import type { components } from '@arc/schemas/api/generated/openapi';
import type { AuthUser } from './auth-user.contract';

export type UpdateMeRequest = components['schemas']['UpdateMeDto'];
export type UpdateMeResponse = AuthUser;
