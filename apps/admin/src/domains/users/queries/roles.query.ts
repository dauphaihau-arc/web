import { getStatusCode } from '@arc/lib';
import { useQuery } from '@tanstack/vue-query';
import type { AdminRoleListResponse } from '../api/contracts/admin-roles.contract';
import { adminRolesApi } from '../api/admin-roles.api';
import { ADMIN_ROLES_LIST_KEY } from './query-keys';

/**
 * The role catalog is static reference data, so it is fetched once per cache
 * lifetime. Callers only enable it when the viewer may act on roles, which
 * keeps a missing `roles.read` from rendering a failure for read-only views.
 */
export function useAdminRoles(enabled: MaybeRefOrGetter<boolean> = true) {
  const isEnabled = computed(() => toValue(enabled));

  return useQuery<AdminRoleListResponse>({
    enabled: isEnabled,
    queryKey: ADMIN_ROLES_LIST_KEY,
    queryFn: () => adminRolesApi.list(),
    // A permission rejection is terminal: retrying cannot grant the role.
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 403 && status !== 404 && failureCount < 3;
    },
  });
}
