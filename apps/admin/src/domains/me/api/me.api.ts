import { isUnauthorizedError } from '@arc/lib';
import type { CurrentUser } from '~/domains/auth/api/contracts/auth-user.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const meApi = {
  async getCurrentOrGuest() {
    try {
      return await apiClient.get<CurrentUser>('/auth/me', undefined, undefined, {
        retryOnUnauthorized: import.meta.client,
      });
    }
    catch (error) {
      if (isUnauthorizedError(error)) {
        return null;
      }

      throw error;
    }
  },
};
