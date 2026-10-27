/** Shared between the list/detail reads and the mutation that refreshes them. */
export const ADMIN_USERS_LIST_KEY = ['admin-users', 'list'] as const;

export const adminUserDetailKey = (userId: string) =>
  ['admin-users', 'detail', userId] as const;

/** The platform's role catalog, read by the create and role-edit pickers. */
export const ADMIN_ROLES_LIST_KEY = ['admin-roles', 'list'] as const;
