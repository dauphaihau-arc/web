import { getStatusCode } from '@arc/lib';
import { readApiError } from '~/shared/lib/api-error';
import type { ListAdminShopsParams } from '~/domains/shops/api/contracts/admin-shops.contract';
import { useAdminShops } from '~/domains/shops/queries/list.query';

export const ADMIN_SHOPS_PAGE_SIZE = 20;

export function useAdminShopsList() {
  const page = ref(1);
  const search = ref('');

  const params = computed<ListAdminShopsParams>(() => ({
    page: page.value,
    limit: ADMIN_SHOPS_PAGE_SIZE,
    ...(search.value.trim() ? { search: search.value.trim() } : {}),
  }));

  const query = useAdminShops(params);

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
    search,
    query,
    isPermissionDenied,
  };
}
