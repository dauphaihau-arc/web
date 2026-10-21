import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { ShopFinancePayable } from '~/domains/shop/api/finance/contracts/payable.contract';

export const SHOP_FINANCE_PAYABLE_QUERY_KEY = 'shop-finance-payable';

export function useShopFinancePayable() {
  const queryClient = useQueryClient();
  return useQuery<ShopFinancePayable>({
    queryKey: [SHOP_FINANCE_PAYABLE_QUERY_KEY],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopFinanceApi.getPayable(shopId);
    },
  });
}
