import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { ShopFinancePayoutSettings } from '~/domains/shop/api/finance/contracts/payout-settings.contract';

export const SHOP_FINANCE_PAYOUT_SETTINGS_QUERY_KEY = 'shop-finance-payout-settings';

export function useShopFinancePayoutSettings() {
  const queryClient = useQueryClient();
  return useQuery<ShopFinancePayoutSettings>({
    queryKey: [SHOP_FINANCE_PAYOUT_SETTINGS_QUERY_KEY],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.getPayoutSettings(shopId);
    },
  });
}
