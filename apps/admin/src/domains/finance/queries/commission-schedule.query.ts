import { getStatusCode } from '@arc/lib';
import { useQuery } from '@tanstack/vue-query';
import type { AdminShopCommissionScheduleResponse } from '../api/contracts/admin-finance.contract';
import { adminFinanceApi } from '../api/admin-finance.api';
import { adminShopCommissionScheduleKey } from './query-keys';

/**
 * The Commission Schedule in force, which is also what the record form starts
 * from. A shop without a schedule, a missing shop and a rejected permission are
 * all "no value" to the surfaces reading this, so none of them is retried.
 */
export function useAdminCommissionSchedule(shopId: MaybeRefOrGetter<string | undefined>) {
  const resolvedId = computed(() => toValue(shopId));

  return useQuery<AdminShopCommissionScheduleResponse>({
    enabled: computed(() => !!resolvedId.value),
    queryKey: computed(() => adminShopCommissionScheduleKey(resolvedId.value ?? '')),
    queryFn: () => adminFinanceApi.getCommissionSchedule(resolvedId.value!),
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 403 && status !== 404 && failureCount < 3;
    },
  });
}
