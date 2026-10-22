import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { SHOP_FINANCE_PAYABLE_QUERY_KEY } from '../queries/finance-payable.query';
import { SHOP_FINANCE_PAYOUTS_QUERY_KEY } from '../queries/payouts.query';
import { SHOP_FINANCE_PAYOUT_SETTINGS_QUERY_KEY } from '../queries/payout-settings.query';
import { SHOP_FINANCE_TRANSACTIONS_QUERY_KEY } from '../queries/transactions.query';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { RequestShopFinanceManualPayoutRequest } from '~/domains/shop/api/finance/contracts/manual-payout.contract';
import { toastCustom } from '~/shared/config/toast';

/**
 * A manual withdrawal moves the available Seller Payable now. It changes the
 * payout history and the available balance, and the remaining quota is read
 * from the settings.
 */
export function useRequestShopFinanceManualPayout() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-request-manual-payout'],
    mutationFn: async (body: RequestShopFinanceManualPayoutRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.requestManualPayout(shopId, body);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYOUTS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYABLE_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYOUT_SETTINGS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_TRANSACTIONS_QUERY_KEY] }),
      ]);

      toast.add({
        ...toastCustom.success,
        title: 'Withdrawal requested',
        description: 'The payout is on its way to your payout account.',
      });
    },
  });
}
