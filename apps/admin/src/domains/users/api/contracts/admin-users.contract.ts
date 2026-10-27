/**
 * A platform operator's view of a user account. The list and detail endpoints
 * share one shape, and both carry the account's roles so an operator can tell
 * a seller from a buyer without opening the account.
 */

export type AdminUserStatus = 'active' | 'disabled';

export type ListAdminUsersParams = {
  page: number
  limit: number
  search?: string
  sort?: string
};

export interface AdminUser {
  /** Internal user id. */
  id: string
  version: number
  email: string
  display_name?: string
  avatar?: string
  status: string
  roles: string[]
}

export interface AdminUserListMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next_page: boolean
  has_previous_page: boolean
}

export interface AdminUserListResponse {
  items: AdminUser[]
  meta: AdminUserListMeta
}

export type UpdateAdminUserBody = {
  version: number
  display_name?: string
  status?: AdminUserStatus
};

export type CreateAdminUserBody = {
  email: string
  password: string
  display_name?: string
};

/** The complete role set for the account; an empty array clears every role. */
export type AssignAdminUserRolesBody = {
  roles: string[]
};
