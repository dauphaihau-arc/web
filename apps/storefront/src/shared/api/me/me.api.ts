import { isUnauthorizedError } from '@arc/lib';
import type { CurrentUser } from '~/shared/api/auth/contracts/auth-user.contract';
import type { UpdateMeRequest, UpdateMeResponse } from '~/shared/api/auth/contracts/update-me.contract';
import { apiClient } from '~/shared/lib/api-client';

export const meApi = {
  async getCurrentOrGuest() {
    try {
      return await apiClient.get<CurrentUser>(
        '/auth/me',
        undefined,
        undefined,
        { retryOnUnauthorized: false }
      );
    }
    catch (error) {
      if (isUnauthorizedError(error)) {
        return null;
      }

      throw error;
    }
  },
  getCurrent() {
    return apiClient.get<CurrentUser>(
      '/auth/me',
      undefined,
      undefined,
      { retryOnUnauthorized: false }
    );
  },
  updateCurrent(payload: UpdateMeRequest) {
    return apiClient.patch<UpdateMeResponse>(
      '/me',
      payload
    );
  },
};
