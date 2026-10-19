import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type {
  SaveShopFinancePayoutAccountRequestBody,
  ShopFinancePayoutAccountResponse,
} from '~/domains/shop/api/finance/contracts/payout-account.contract';

export const SHOP_FINANCE_PAYOUT_ACCOUNT_QUERY_KEY = 'shop-finance-payout-account';

export function useShopFinancePayoutAccount() {
  const queryClient = useQueryClient();
  return useQuery<ShopFinancePayoutAccountResponse>({
    queryKey: [SHOP_FINANCE_PAYOUT_ACCOUNT_QUERY_KEY],
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.getPayoutAccount(shopId);
    },
  });
}

export function useSaveShopFinancePayoutAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['shop-save-payout-account'],
    mutationFn: async (body: SaveShopFinancePayoutAccountRequestBody) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.savePayoutAccount(shopId, body);
    },
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: [SHOP_FINANCE_PAYOUT_ACCOUNT_QUERY_KEY],
    }),
  });
}
