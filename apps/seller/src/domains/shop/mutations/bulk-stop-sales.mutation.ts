import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopSaleApi } from '~/domains/shop/api/sale/sale.api';
import type { BulkStopShopSalesRequest } from '~/domains/shop/api/sale/contracts/sale.contract';

/**
 * Cancels scheduled Sales and ends active Sales in one request. Sales that are
 * already ended or cancelled come back as failures and stay in the list.
 */
export function useShopBulkStopSales() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-bulk-stop-sales'],
    mutationFn: async (payload: BulkStopShopSalesRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopSaleApi.bulkStop(shopId, payload);
    },
    onSuccess(result) {
      queryClient.invalidateQueries({ queryKey: ['shop-get-sales'] });

      if (result.failed.length === 0) {
        toast.add({
          ...toastCustom.success,
          title: 'Sales stopped',
          description: `${result.succeeded_ids.length} sale(s) cancelled or ended.`,
        });
        return;
      }

      toast.add({
        ...(result.succeeded_ids.length > 0 ? toastCustom.warning : toastCustom.error),
        title: result.succeeded_ids.length > 0
          ? 'Sales stopped with some failures'
          : 'Failed to stop sales',
        description: `${result.succeeded_ids.length} succeeded, ${result.failed.length} failed.`,
      });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to stop sales',
      });
    },
  });
}
