import { getStatusCode } from '@arc/lib';
import type { OrderStatuses } from '@arc/enums/order';
import { readApiError } from '~/shared/lib/api-error';
import type { ListAdminOrdersParams } from '~/domains/orders/api/contracts/admin-orders.contract';
import { useAdminOrders } from '~/domains/orders/queries/list.query';

export const ADMIN_ORDERS_PAGE_SIZE = 20;

export function useAdminOrdersList() {
  const page = ref(1);
  const status = ref<OrderStatuses[]>([]);
  const search = ref('');

  const params = computed<ListAdminOrdersParams>(() => ({
    page: page.value,
    limit: ADMIN_ORDERS_PAGE_SIZE,
    ...(status.value.length > 0 ? { status: status.value.join(',') } : {}),
    ...(search.value ? { search: search.value } : {}),
  }));

  const query = useAdminOrders(params);

  watch(status, () => {
    page.value = 1;
  }, { deep: true });

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
    status,
    search,
    query,
    isPermissionDenied,
  };
}
