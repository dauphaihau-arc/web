import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { SHOP_FINANCE_PAYABLE_QUERY_KEY } from '../queries/finance-payable.query';
import { SHOP_FINANCE_PAYOUT_SETTINGS_QUERY_KEY } from '../queries/payout-settings.query';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { UpdateShopFinancePayoutSettingsRequest } from '~/domains/shop/api/finance/contracts/payout-settings.contract';

/**
 * Turns auto payout on or off. Both the settings and the Seller Payable are
 * refetched: the toggle changes what the page may offer, and the API owns the
 * resulting state.
 */
export function useUpdateShopFinancePayoutSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['shop-update-payout-settings'],
    mutationFn: async (body: UpdateShopFinancePayoutSettingsRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.savePayoutSettings(shopId, body);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYOUT_SETTINGS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYABLE_QUERY_KEY] }),
      ]);
    },
  });
}
