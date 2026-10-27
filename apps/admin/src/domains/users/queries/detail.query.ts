import { getStatusCode } from '@arc/lib';
import { useQuery } from '@tanstack/vue-query';
import type { AdminUser } from '../api/contracts/admin-users.contract';
import { adminUsersApi } from '../api/admin-users.api';
import { adminUserDetailKey } from './query-keys';

export function useAdminUser(userId: MaybeRefOrGetter<string | undefined>) {
  const resolvedId = computed(() => toValue(userId));

  return useQuery<AdminUser>({
    enabled: computed(() => !!resolvedId.value),
    queryKey: computed(() => adminUserDetailKey(resolvedId.value ?? '')),
    queryFn: () => adminUsersApi.get(resolvedId.value!),
    // A missing user never starts existing on retry, and a permission
    // rejection cannot be fixed by asking again.
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 404 && status !== 403 && failureCount < 3;
    },
  });
}
