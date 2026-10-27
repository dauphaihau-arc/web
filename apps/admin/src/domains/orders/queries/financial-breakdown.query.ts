import { getStatusCode } from '@arc/lib';
import { useQuery } from '@tanstack/vue-query';
import { adminOrdersApi } from '../api/admin-orders.api';
import { adminOrderFinancialBreakdownKey } from './query-keys';

/**
 * The order's money basis for the seller and platform settlement rows. A
 * permission rejection is final, and a missing order never gains a journal
 * basis by asking again, so neither is retried.
 */
export function useAdminOrderFinancialBreakdown(orderId: MaybeRefOrGetter<string | undefined>) {
  const resolvedId = computed(() => toValue(orderId));

  return useQuery({
    enabled: computed(() => !!resolvedId.value),
    queryKey: computed(() => adminOrderFinancialBreakdownKey(resolvedId.value ?? '')),
    queryFn: () => adminOrdersApi.getFinancialBreakdown(resolvedId.value!),
    retry: (failureCount, error) => {
      const status = getStatusCode(error);

      return status !== 403 && status !== 404 && failureCount < 3;
    },
  });
}
