import type { components } from '@arc/schemas/api/generated/openapi';
import type { AuthUserEnvelope } from './auth-user.contract';

export type RegisterRequest = components['schemas']['RegisterDto'];
export type RegisterResponse = AuthUserEnvelope;
