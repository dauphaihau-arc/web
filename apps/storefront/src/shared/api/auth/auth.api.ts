import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'
import type { AuthClientConfigResponse } from './contracts/client-config.contract'
import type {
  ForgotPasswordRequest,
  ForgotPasswordResponse,
} from './contracts/forgot-password.contract'
import type {
  LoginRequest,
  LoginResponse,
} from './contracts/login.contract'
import type {
  RegisterRequest,
  RegisterResponse,
} from './contracts/register.contract'
import type {
  ResetPasswordResponse,
} from './contracts/reset-password.contract'
import type {
  VerifyTokenResponse,
} from './contracts/verify-token.contract'
import { apiClient } from '~/shared/lib/api-client'

export const authApi = {
  getClientConfig() {
    return apiClient.get<AuthClientConfigResponse>(
      '/auth/client-config',
      undefined,
      undefined,
      { retryOnWakeUp: true, retryOnUnauthorized: false },
    )
  },

  forgotPassword(payload: ForgotPasswordRequest) {
    return apiClient.post<ForgotPasswordResponse>(
      '/auth/forgot-password',
      payload,
      undefined,
      { retryOnUnauthorized: false },
    )
  },

  login(payload: LoginRequest) {
    return apiClient.post<LoginResponse>(
      '/auth/login',
      payload,
      undefined,
      { retryOnUnauthorized: false },
    )
  },

  logout() {
    return apiClient.post<undefined>(
      '/auth/logout',
      null,
      undefined,
      { retryOnUnauthorized: false },
    )
  },

  register(payload: RegisterRequest) {
    return apiClient.post<RegisterResponse>(
      '/auth/register',
      payload,
      undefined,
      { retryOnUnauthorized: false },
    )
  },

  resetPassword(token: string, password: string) {
    return apiClient.post<ResetPasswordResponse>(
      `/auth/reset-password?token=${token}`,
      { password },
      undefined,
      { retryOnUnauthorized: false },
    )
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
    )
  },
}
