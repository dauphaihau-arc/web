import { getStatusCode } from '@arc/lib';
import { useQuery } from '@tanstack/vue-query';
import type { AdminShopPayable } from '../api/contracts/admin-finance.contract';
import { adminFinanceApi } from '../api/admin-finance.api';
import { adminShopPayableKey } from './query-keys';

export function useAdminShopPayable(shopId: MaybeRefOrGetter<string | undefined>) {
  const resolvedId = computed(() => toValue(shopId));

  return useQuery<AdminShopPayable>({
    enabled: computed(() => !!resolvedId.value),
    queryKey: computed(() => adminShopPayableKey(resolvedId.value ?? '')),
    queryFn: () => adminFinanceApi.getPayable(resolvedId.value!),
    // A missing shop never starts existing on retry, and a permission
    // rejection cannot be fixed by asking again.
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 403 && status !== 404 && failureCount < 3;
    },
  });
}
