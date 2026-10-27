import type { AdminUserStatus } from '../api/contracts/admin-users.contract';

export type UserStatusTone = 'green' | 'gray' | 'yellow' | 'red' | 'blue';

/**
 * The statuses an operator may set. The API rejects every other value, so the
 * form only offers these.
 */
export const ADMIN_USER_STATUSES: readonly AdminUserStatus[] = ['active', 'disabled'];

export function formatUserStatusLabel(status?: string) {
  if (!status) {
    return '';
  }

  return status.replaceAll('_', ' ');
}

export const ADMIN_USER_STATUS_OPTIONS = ADMIN_USER_STATUSES.map(status => ({
  label: formatUserStatusLabel(status),
  value: status,
}));

export function isAdminUserStatus(value: unknown): value is AdminUserStatus {
  return typeof value === 'string'
    && (ADMIN_USER_STATUSES as readonly string[]).includes(value);
}

export function userStatusTone(status?: string): UserStatusTone {
  switch (status) {
    case 'active':
      return 'green';
    case 'disabled':
      return 'red';
    default:
      return 'gray';
  }
}

/** Roles are stored as machine names; the UI shows them as readable labels. */
export function formatUserRoleLabel(role: string) {
  return role.replaceAll('_', ' ');
}
