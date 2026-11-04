import type { components } from '@arc/schemas/api/generated/openapi';
import type { AuthUserEnvelope } from './auth-user.contract';

export type ResetPasswordRequest = components['schemas']['ResetPasswordDto'];
export type ResetPasswordResponse = AuthUserEnvelope;
export type ResetPasswordForm = Record<'password' | 'passwordConfirm', string>;
