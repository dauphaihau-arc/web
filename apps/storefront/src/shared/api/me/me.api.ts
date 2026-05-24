import type { AuthUser } from '~/shared/api/auth/contracts/auth-user.contract';
import type { UpdateMeRequest, UpdateMeResponse } from '~/shared/api/auth/contracts/update-me.contract';
import { apiClient } from '~/shared/lib/api-client';

export const meApi = {
  getCurrent() {
    return apiClient.get<AuthUser>(
      '/auth/me'
    );
  },
  updateCurrent(payload: UpdateMeRequest) {
    return apiClient.patch<UpdateMeResponse>(
      '/me',
      payload
    );
  },
};
