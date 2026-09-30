import type { ComputedRef } from 'vue';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopSaleApi } from '~/domains/shop/api/sale/sale.api';
import type {
  ListShopSalesRequest,
  ListShopSalesResponse,
} from '~/domains/shop/api/sale/contracts/sale.contract';

export function useShopGetSales(queryParams: ComputedRef<ListShopSalesRequest>) {
  const queryClient = useQueryClient();
  return useQuery<ListShopSalesResponse>({
    queryKey: ['shop-get-sales', queryParams],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopSaleApi.list(shopId, queryParams.value);
    },
  });
}
