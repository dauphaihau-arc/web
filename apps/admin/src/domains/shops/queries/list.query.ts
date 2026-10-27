import { getStatusCode } from '@arc/lib';
import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import type {
  AdminShopListResponse,
  ListAdminShopsParams,
} from '../api/contracts/admin-shops.contract';
import { adminShopsApi } from '../api/admin-shops.api';
import { ADMIN_SHOPS_LIST_KEY } from './query-keys';

export function useAdminShops(query: MaybeRefOrGetter<ListAdminShopsParams>) {
  const resolvedQuery = computed(() => toValue(query));

  return useQuery<AdminShopListResponse>({
    queryKey: computed(() => [
      ...ADMIN_SHOPS_LIST_KEY,
      resolvedQuery.value,
    ]),
    queryFn: () => adminShopsApi.list(resolvedQuery.value),
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
