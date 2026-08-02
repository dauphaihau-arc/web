import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopDashboardApi } from '~/domains/shop/api/dashboard/dashboard.api';
import type { GetShopDashboardRequest } from '~/domains/shop/api/dashboard/contracts/dashboard.contract';

export function useShopDashboard(query?: MaybeRefOrGetter<GetShopDashboardRequest>) {
  const queryClient = useQueryClient();
  const resolvedQuery = computed(() => toValue(query));

  return useQuery({
    queryKey: ['shop-dashboard', resolvedQuery],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopDashboardApi.get(shopId, resolvedQuery.value);
    },
  });
}
