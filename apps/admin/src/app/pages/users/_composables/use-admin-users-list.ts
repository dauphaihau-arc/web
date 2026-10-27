import { getStatusCode } from '@arc/lib';
import { readApiError } from '~/shared/lib/api-error';
import type { ListAdminUsersParams } from '~/domains/users/api/contracts/admin-users.contract';
import { useAdminUsersList } from '~/domains/users/queries/list.query';

export const ADMIN_USERS_PAGE_SIZE = 20;

export function useAdminUsersListPage() {
  const page = ref(1);
  const search = ref('');

  const params = computed<ListAdminUsersParams>(() => ({
    page: page.value,
    limit: ADMIN_USERS_PAGE_SIZE,
    ...(search.value.trim() ? { search: search.value.trim() } : {}),
  }));

  const query = useAdminUsersList(params);

  watch(search, () => {
    page.value = 1;
  });

  const isPermissionDenied = computed(() =>
    query.isError.value
    && getStatusCode(query.error.value) === 403
    && readApiError(query.error.value).code === 'MISSING_REQUIRED_PERMISSIONS',
  );

  return {
    page,
    search,
    query,
    isPermissionDenied,
  };
}
