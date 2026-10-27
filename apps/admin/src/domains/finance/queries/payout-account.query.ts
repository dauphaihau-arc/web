import { getStatusCode } from '@arc/lib';
import { useQuery } from '@tanstack/vue-query';
import type { AdminShopPayoutAccountResponse } from '../api/contracts/admin-finance.contract';
import { adminFinanceApi } from '../api/admin-finance.api';
import { adminShopPayoutAccountKey } from './query-keys';

export function useAdminShopPayoutAccount(shopId: MaybeRefOrGetter<string | undefined>) {
  const resolvedId = computed(() => toValue(shopId));

  return useQuery<AdminShopPayoutAccountResponse>({
    enabled: computed(() => !!resolvedId.value),
    queryKey: computed(() => adminShopPayoutAccountKey(resolvedId.value ?? '')),
    queryFn: () => adminFinanceApi.getPayoutAccount(resolvedId.value!),
    // A missing shop never starts existing on retry, and a permission
    // rejection cannot be fixed by asking again.
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 403 && status !== 404 && failureCount < 3;
    },
  });
}
