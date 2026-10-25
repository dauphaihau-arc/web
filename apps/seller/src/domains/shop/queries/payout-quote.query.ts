import { keepPreviousData, useQuery } from '@tanstack/vue-query';
import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { ShopFinancePayoutQuote } from '~/domains/shop/api/finance/contracts/payout.contract';

export const SHOP_FINANCE_PAYOUT_QUOTE_QUERY_KEY = 'shop-finance-payout-quote';

/**
 * The server quote for withdrawing `amountMinor` in the shop currency. The
 * amount is part of the query key, so a new amount is a new quote. The previous
 * quote stays available while that one is fetched, which lets the withdraw
 * dialog keep its figures on screen instead of collapsing the panel.
 */
export function useShopFinancePayoutQuote(amountMinor: MaybeRefOrGetter<number | undefined>) {
  const queryClient = useQueryClient();
  const resolvedAmount = computed(() => toValue(amountMinor) ?? 0);

  return useQuery<ShopFinancePayoutQuote>({
    queryKey: computed(() => [
      SHOP_FINANCE_PAYOUT_QUOTE_QUERY_KEY,
      { amount_minor: resolvedAmount.value },
    ]),
    queryFn: async () => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopFinanceApi.getPayoutQuote(shopId, {
        amount_minor: resolvedAmount.value,
      });
    },
    enabled: computed(() => resolvedAmount.value > 0),
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
