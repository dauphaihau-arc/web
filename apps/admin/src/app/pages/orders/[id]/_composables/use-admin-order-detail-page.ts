import { getStatusCode } from '@arc/lib';
import { readApiError } from '~/shared/lib/api-error';
import { useAdminOrderDetail } from '~/domains/orders/queries/detail.query';

export function useAdminOrderDetailPage(orderId: MaybeRefOrGetter<string>) {
  const resolvedId = computed(() => toValue(orderId));
  const query = useAdminOrderDetail(resolvedId);
  const order = computed(() => query.data.value?.order);

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

    return !query.isPending.value && !order.value;
  });

  function retry() {
    void query.refetch();
  }

  return {
    order,
    query,
    isPermissionDenied,
    isNotFound,
    retry,
  };
}
