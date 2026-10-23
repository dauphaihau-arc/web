import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { SHOP_FINANCE_PAYABLE_QUERY_KEY } from '../queries/finance-payable.query';
import { SHOP_FINANCE_PAYOUT_ACCOUNT_QUERY_KEY } from '../queries/payout-account.query';
import { SHOP_FINANCE_PAYOUT_SETTINGS_QUERY_KEY } from '../queries/payout-settings.query';
import { SHOP_FINANCE_PAYOUTS_QUERY_KEY } from '../queries/payouts.query';
import { SHOP_FINANCE_SETTLEMENT_CURRENCY_QUERY_KEY } from '../queries/settlement-currency.query';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { ChangeShopFinanceSettlementCurrencyRequest } from '~/domains/shop/api/finance/contracts/settlement-currency.contract';

/**
 * Moves the shop to another Settlement Currency. The API owns the decision and
 * the resulting state, so every view that depends on the currency is refetched:
 * the settings row, Seller Payable, the Payout Account (the old one is now
 * historical), auto payout, and the shop itself, whose currency new prices use.
 */
export function useChangeShopFinanceSettlementCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['shop-change-settlement-currency'],
    mutationFn: async (body: ChangeShopFinanceSettlementCurrencyRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopFinanceApi.changeSettlementCurrency(shopId, body);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_SETTLEMENT_CURRENCY_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYABLE_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYOUTS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYOUT_ACCOUNT_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [SHOP_FINANCE_PAYOUT_SETTINGS_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: ['my-shop'] }),
      ]);
    },
  });
}
