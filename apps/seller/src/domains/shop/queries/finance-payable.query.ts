import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { ShopFinancePayable } from '~/domains/shop/api/finance/contracts/payable.contract';

export function useShopFinancePayable() {
  const queryClient = useQueryClient();
  return useQuery<ShopFinancePayable>({
    queryKey: ['shop-finance-payable'],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopFinanceApi.getPayable(shopId);
    },
  });
}
