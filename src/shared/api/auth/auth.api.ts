import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack';
import type { AuthClientConfigResponse } from './client-config';
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse
} from './forgot-password';
import type {
  LoginRequest,
  LoginResponse
} from './login';
import type { LogoutResponse } from './logout';
import type {
  RegisterRequest,
  RegisterResponse
} from './register';
import type {
  ResetPasswordResponse
} from './reset-password';
import type {
  VerifyTokenResponse
} from './verify-token';
import { apiClient } from '~/shared/lib/api-client';

export const authApi = {
  getClientConfig() {
    return apiClient.get<AuthClientConfigResponse>(
      '/auth/client-config',
      undefined,
      undefined,
      { retryOnWakeUp: true }
    );
  },

  forgotPassword(payload: ForgotPasswordRequest) {
    return apiClient.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      payload
    );
  },

  login(payload: LoginRequest) {
    return apiClient.post<LoginResponse>(
      '/auth/login',
      payload
    );
  },

  logout() {
    return apiClient.post<LogoutResponse>(
      '/auth/logout',
      null
    );
  },

  register(payload: RegisterRequest) {
    return apiClient.post<RegisterResponse>(
      '/auth/register',
      payload
    );
  },

  resetPassword(token: string, password: string) {
    return apiClient.post<ResetPasswordResponse>(
      `/auth/reset-password?token=${token}`,
      { password }
    );
  },

  verifyToken(
    token: string,
    type: string,
    options?: NitroFetchOptions<NitroFetchRequest>
  ) {
    return apiClient.get<VerifyTokenResponse>(
      `/auth/verify-token?token=${token}&type=${type}`,
      undefined,
      options
    );
  },
};
