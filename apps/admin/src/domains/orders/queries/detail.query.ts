import { getStatusCode } from '@arc/lib';
import { useQuery } from '@tanstack/vue-query';
import { adminOrdersApi } from '../api/admin-orders.api';
import { adminOrderDetailKey } from './query-keys';

export function useAdminOrderDetail(orderId: MaybeRefOrGetter<string | undefined>) {
  const resolvedId = computed(() => toValue(orderId));

  return useQuery({
    enabled: computed(() => !!resolvedId.value),
    queryKey: computed(() => adminOrderDetailKey(resolvedId.value ?? '')),
    queryFn: () => adminOrdersApi.get(resolvedId.value!),
    // A missing order never starts existing on retry, and a permission
    // rejection cannot be fixed by asking again.
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 404 && status !== 403 && failureCount < 3;
    },
  });
}
