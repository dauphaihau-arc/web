import { getStatusCode } from '@arc/lib';
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import type {
  AdminOrderListResponse,
  ListAdminOrdersParams,
} from '../api/contracts/admin-orders.contract';
import { adminOrdersApi } from '../api/admin-orders.api';
import { ADMIN_ORDERS_LIST_KEY } from './query-keys';

export function useAdminOrders(query: MaybeRefOrGetter<ListAdminOrdersParams>) {
  const resolvedQuery = computed(() => toValue(query));

  return useQuery<AdminOrderListResponse>({
    queryKey: computed(() => [
      ...ADMIN_ORDERS_LIST_KEY,
      resolvedQuery.value,
    ]),
    queryFn: () => adminOrdersApi.list(resolvedQuery.value),
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
