import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { AuthClientConfigResponse } from './contracts/client-config.contract';
import type {
  LoginRequest,
  LoginResponse,
} from './contracts/login.contract';
import type {
  VerifyTokenResponse,
} from './contracts/verify-token.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const authApi = {
  getClientConfig() {
    return apiClient.get<AuthClientConfigResponse>(
      '/auth/client-config',
      undefined,
      undefined,
      { retryOnWakeUp: true, retryOnUnauthorized: false },
    );
  },

  login(payload: LoginRequest) {
    return apiClient.post<LoginResponse>(
      '/auth/login',
      payload,
      undefined,
      { retryOnUnauthorized: false },
    );
  },

  logout() {
    return apiClient.post<undefined>(
      '/auth/logout',
      null,
      undefined,
      { retryOnUnauthorized: false },
    );
  },

  verifyToken(
    token: string,
    type: string,
    options?: NitroFetchOptions<NitroFetchRequest>,
  ) {
    return apiClient.get<VerifyTokenResponse>(
      `/auth/verify-token?token=${token}&type=${type}`,
      undefined,
      options,
      { retryOnUnauthorized: false },
    );
  },
};
