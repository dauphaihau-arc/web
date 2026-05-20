import type { GetCurrentUserResponse } from './current-user';
import type { UpdateCurrentUserRequest, UpdateCurrentUserResponse } from './update-current-user';
import { apiClient } from '~/shared/lib/api-client';

export const meApi = {
  getCurrent() {
    return apiClient.get<GetCurrentUserResponse['user']>(
      '/auth/me'
    );
  },
  updateCurrent(payload: UpdateCurrentUserRequest) {
    return apiClient.patch<UpdateCurrentUserResponse>(
      '/me',
      payload
    );
  },
};
