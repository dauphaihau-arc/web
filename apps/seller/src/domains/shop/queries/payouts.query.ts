import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { ShopFinancePayoutHistory } from '~/domains/shop/api/finance/contracts/payout.contract';

export const SHOP_FINANCE_PAYOUTS_QUERY_KEY = 'shop-finance-payouts';

export function useShopFinancePayouts() {
  const queryClient = useQueryClient();

  return useQuery<ShopFinancePayoutHistory>({
    queryKey: [SHOP_FINANCE_PAYOUTS_QUERY_KEY],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopFinanceApi.getPayouts(shopId);
    },
  });
}
