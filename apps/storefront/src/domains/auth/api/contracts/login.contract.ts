import type { components } from '@arc/schemas/api/generated/openapi';
import type { AuthUserEnvelope } from './auth-user.contract';

export type LoginRequest = components['schemas']['LoginDto'];
export type LoginResponse = AuthUserEnvelope;
