import { getBackendErrorCode } from '~/shared/utils/backend-error';
import {
  translateError,
  type ErrorTranslator,
} from '~/shared/utils/api-error-copy';

const AUTH_CODE_KEY: Record<string, string> = {
  INVALID_CREDENTIALS: 'errors.auth.invalidCredentials',
  INACTIVE_USER: 'errors.auth.inactiveUser',
  PORTAL_ACCESS_DENIED: 'errors.auth.portalAccessDenied',
  EMAIL_ALREADY_REGISTERED: 'errors.auth.emailRegistered',
  INVALID_PASSWORD_RESET_TOKEN: 'errors.auth.invalidResetToken',
  PASSWORD_RESET_TOKEN_EXPIRED: 'errors.auth.resetTokenExpired',
};

/**
 * Localized copy for an auth rejection the client knows by code. Returns
 * `undefined` for an unmapped code so the caller keeps its surface-specific
 * generic message instead of leaking the server's English `message`.
 */
export function resolveAuthErrorMessage(
  error: unknown,
  t: ErrorTranslator = translateError,
): string | undefined {
  const code = getBackendErrorCode(error);
  const key = code ? AUTH_CODE_KEY[code] : undefined;

  return key ? t(key) : undefined;
}
