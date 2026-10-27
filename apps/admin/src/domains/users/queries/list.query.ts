import { getStatusCode } from '@arc/lib';
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import type {
  AdminUserListResponse,
  ListAdminUsersParams,
} from '../api/contracts/admin-users.contract';
import { adminUsersApi } from '../api/admin-users.api';
import { ADMIN_USERS_LIST_KEY } from './query-keys';

export function useAdminUsersList(query: MaybeRefOrGetter<ListAdminUsersParams>) {
  const resolvedQuery = computed(() => toValue(query));

  return useQuery<AdminUserListResponse>({
    queryKey: computed(() => [
      ...ADMIN_USERS_LIST_KEY,
      resolvedQuery.value,
    ]),
    queryFn: () => adminUsersApi.list(resolvedQuery.value),
    // A permission rejection is terminal: retrying cannot grant the role.
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 403 && status !== 404 && failureCount < 3;
    },
    // Paging and searching keep the previous page rendered instead of
    // collapsing to the loading state on every keystroke.
    placeholderData: keepPreviousData,
  });
}
