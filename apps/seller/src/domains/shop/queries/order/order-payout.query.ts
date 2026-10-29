import { getStatusCode } from '@arc/lib';
import { resolveMyShopId } from '../../utils/resolve-my-shop-id';
import { shopFinanceApi } from '~/domains/shop/api/finance/finance.api';
import type { ShopOrderPayout } from '~/domains/shop/api/finance/contracts/order-payout.contract';

/**
 * The payout fact for one Order. `shopId` may be supplied by a caller that
 * already resolved it; otherwise it comes from the same cached My Shop lookup
 * every seller finance query uses.
 */
export function useShopGetOrderPayout(
  orderId?: string,
  shopId?: string,
  options: { pollWhile?: MaybeRefOrGetter<boolean> } = {},
) {
  const queryClient = useQueryClient();
  const shouldPoll = computed(() => Boolean(options.pollWhile && toValue(options.pollWhile)));

  const query = useQuery<ShopOrderPayout>({
    enabled: !!orderId,
    // A plain value keeps the key byte-identical to the invalidation key used by
    // the order mutations; a ref in the key would never match them.
    queryKey: ['shop-order-payout', orderId],
    queryFn: async () => {
      const shopIdValue = shopId ?? await resolveMyShopId(queryClient);
      return await shopFinanceApi.getOrderPayout(shopIdValue, orderId!);
    },
    // A missing or foreign order never starts existing on retry: skip those so
    // the progress view simply omits the payout step, and keep retries for
    // transient failures only.
    retry: (failureCount, error) => {
      const status = getStatusCode(error);
      return status !== 403 && status !== 404 && failureCount < 3;
    },
  });

  /**
   * Money events are booked from the outbox by the finance worker, so the
   * availability row can land moments after the delivery mutation resolves.
   * While the order is fully delivered and Finance has not recorded
   * availability yet, refetch until it appears instead of waiting for a reload.
   * This runs beside the query (not as `refetchInterval`) so it re-evaluates as
   * both the order and the fetched facts change.
   */
  watchEffect((onCleanup) => {
    if (!shouldPoll.value || query.data.value?.availability.recorded) {
      return;
    }

    const timer = setInterval(() => {
      void query.refetch();
    }, 5_000);

    onCleanup(() => clearInterval(timer));
  });

  return query;
}
