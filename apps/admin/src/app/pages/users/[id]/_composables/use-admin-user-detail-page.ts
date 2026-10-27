import { getStatusCode } from '@arc/lib';
import { readApiError } from '~/shared/lib/api-error';
import { useAdminUser } from '~/domains/users/queries/detail.query';

export function useAdminUserDetailPage(userId: MaybeRefOrGetter<string>) {
  const resolvedId = computed(() => toValue(userId));
  const query = useAdminUser(resolvedId);
  const user = computed(() => query.data.value);

  const isPermissionDenied = computed(() =>
    query.isError.value
    && getStatusCode(query.error.value) === 403
    && readApiError(query.error.value).code === 'MISSING_REQUIRED_PERMISSIONS',
  );

  const isNotFound = computed(() => {
    if (isPermissionDenied.value) {
      return false;
    }

    if (query.isError.value) {
      return getStatusCode(query.error.value) === 404;
    }

    return !query.isPending.value && !user.value;
  });

  function retry() {
    void query.refetch();
  }

  return {
    user,
    query,
    isPermissionDenied,
    isNotFound,
    retry,
  };
}
