import type {
  AdminUser,
  AdminUserListResponse,
  AssignAdminUserRolesBody,
  CreateAdminUserBody,
  ListAdminUsersParams,
  UpdateAdminUserBody,
} from './contracts/admin-users.contract';
import { apiClient } from '~/domains/_shared/api-client';

const USERS = '/users';

export const adminUsersApi = {
  list(params: ListAdminUsersParams) {
    return apiClient.get<AdminUserListResponse>(USERS, params);
  },

  get(userId: string) {
    return apiClient.get<AdminUser>(`${USERS}/${userId}`);
  },

  update(userId: string, body: UpdateAdminUserBody) {
    return apiClient.patch<AdminUser>(`${USERS}/${userId}`, body);
  },

  create(body: CreateAdminUserBody) {
    return apiClient.post<AdminUser>(USERS, body);
  },

  assignRoles(userId: string, body: AssignAdminUserRolesBody) {
    return apiClient.patch<AdminUser>(`${USERS}/${userId}/roles`, body);
  },
};
