import { getStatusCode } from '@arc/lib';
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import type {
  AdminAuditLogListResponse,
  ListAdminAuditLogsParams,
} from '../api/contracts/admin-audit.contract';
import { adminAuditApi } from '../api/admin-audit.api';
import { ADMIN_AUDIT_LIST_KEY } from './query-keys';

export function useAdminAuditLogs(
  query: MaybeRefOrGetter<ListAdminAuditLogsParams>,
) {
  const resolvedQuery = computed(() => toValue(query));

  return useQuery<AdminAuditLogListResponse>({
    queryKey: computed(() => [
      ...ADMIN_AUDIT_LIST_KEY,
      resolvedQuery.value,
    ]),
    queryFn: () => adminAuditApi.list(resolvedQuery.value),
    // A permission rejection is terminal: retrying cannot grant the role.
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 403 && status !== 404 && failureCount < 3;
    },
    // Paging and filtering keep the previous page rendered instead of
    // collapsing to the loading state on every keystroke.
    placeholderData: keepPreviousData,
  });
}
