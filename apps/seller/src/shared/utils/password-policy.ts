import type { FormError } from '#ui/types';
import type { AuthClientConfigResponse as AuthClientConfig } from '~/shared/api/auth/contracts/client-config.contract';

export const DEFAULT_AUTH_CLIENT_CONFIG: AuthClientConfig = {
  version: 'bootstrap-fallback-v1',
  password: {
    min_length: 8,
    max_length: 64,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).+$',
    requirements: {
      lowercase: true,
      uppercase: true,
      number: true,
      special_character: true,
    },
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  },
  session: {
    access_token_ttl_seconds: 15 * 60,
    refresh_token_ttl_seconds: 7 * 24 * 60 * 60,
  },
  ai: {
    product_description_enabled: false,
  },
};

export function validatePasswordByPolicy(
  password: string | undefined,
  policy: AuthClientConfig = DEFAULT_AUTH_CLIENT_CONFIG
): string | undefined {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < policy.password.min_length) {
    return `Password must be at least ${policy.password.min_length} characters`;
  }

  if (password.length > policy.password.max_length) {
    return `Password must be no longer than ${policy.password.max_length} characters`;
  }

  const pattern = new RegExp(policy.password.pattern);

  if (!pattern.test(password)) {
    return policy.password.message;
  }

  return undefined;
}

export function appendPasswordError(
  errors: FormError[],
  path: string,
  password: string | undefined,
  policy: AuthClientConfig = DEFAULT_AUTH_CLIENT_CONFIG
) {
  const message = validatePasswordByPolicy(password, policy);

  if (message) {
    errors.push({ path, message });
  }
}
