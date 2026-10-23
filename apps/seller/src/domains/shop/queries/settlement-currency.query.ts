import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { ShopFinanceSettlementCurrency } from '~/domains/shop/api/finance/contracts/settlement-currency.contract';

export const SHOP_FINANCE_SETTLEMENT_CURRENCY_QUERY_KEY = 'shop-finance-settlement-currency';

export function useShopFinanceSettlementCurrency() {
  const queryClient = useQueryClient();
  return useQuery<ShopFinanceSettlementCurrency>({
    queryKey: [SHOP_FINANCE_SETTLEMENT_CURRENCY_QUERY_KEY],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.getSettlementCurrency(shopId);
    },
  });
}
