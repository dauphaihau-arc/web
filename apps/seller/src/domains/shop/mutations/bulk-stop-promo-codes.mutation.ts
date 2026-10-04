import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopPromoCodeApi } from '~/domains/shop/api/promo-code/promo-code.api';
import type { BulkStopShopPromoCodesRequest } from '~/domains/shop/api/promo-code/contracts/promo-code.contract';

/**
 * Cancels scheduled Promo Codes and ends active Promo Codes in one request.
 * Promo Codes that are already ended or cancelled come back as failures and
 * stay in the list.
 */
export function useShopBulkStopPromoCodes() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-bulk-stop-promo-codes'],
    mutationFn: async (payload: BulkStopShopPromoCodesRequest) => {
      const shopId = await resolveMyShopId(queryClient);
      return shopPromoCodeApi.bulkStop(shopId, payload);
    },
    onSuccess(result) {
      queryClient.invalidateQueries({ queryKey: ['shop-get-promo-codes'] });

      if (result.failed.length === 0) {
        toast.add({
          ...toastCustom.success,
          title: 'Promo codes stopped',
          description: `${result.succeeded_ids.length} promo code(s) cancelled or ended.`,
        });
        return;
      }

      toast.add({
        ...(result.succeeded_ids.length > 0 ? toastCustom.warning : toastCustom.error),
        title: result.succeeded_ids.length > 0
          ? 'Promo codes stopped with some failures'
          : 'Failed to stop promo codes',
        description: `${result.succeeded_ids.length} succeeded, ${result.failed.length} failed.`,
      });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to stop promo codes',
      });
    },
  });
}
