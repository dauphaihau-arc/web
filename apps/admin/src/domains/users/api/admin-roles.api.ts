import type { AdminRoleListResponse } from './contracts/admin-roles.contract';
import { apiClient } from '~/domains/_shared/api-client';

const ROLES = '/roles';

export const adminRolesApi = {
  list() {
    return apiClient.get<AdminRoleListResponse>(ROLES);
  },
};
