import type { CurrentUser } from '~/domains/auth/api/contracts/auth-user.contract';
import type { UpdateMeRequest, UpdateMeResponse } from '~/domains/auth/api/contracts/update-me.contract';
import { apiClient } from '~/shared/lib/api-client';

export const meApi = {
  getCurrent() {
    return apiClient.get<CurrentUser>(
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
