import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopSaleApi } from '~/domains/shop/api/sale/sale.api';

export type ShopSaleStopAction = 'cancel' | 'end';

/**
 * Irreversibly stops one Sale: a scheduled Sale is cancelled, an active Sale is
 * ended early. Neither is a delete, so the list is refreshed rather than having
 * a row removed.
 */
export function useShopStopSale() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-stop-sale'],
    mutationFn: async (payload: { saleId: string, action: ShopSaleStopAction }) => {
      const shopId = await resolveMyShopId(queryClient);

      return payload.action === 'cancel'
        ? shopSaleApi.cancel(shopId, payload.saleId)
        : shopSaleApi.end(shopId, payload.saleId);
    },
    onSuccess(_result, variables) {
      queryClient.invalidateQueries({ queryKey: ['shop-get-sales'] });

      toast.add({
        ...toastCustom.success,
        title: variables.action === 'cancel' ? 'Sale cancelled' : 'Sale ended',
        description: variables.action === 'cancel'
          ? 'The scheduled sale will never start. Its definition and order history are kept.'
          : 'The sale ended early. Its definition and order history are kept.',
      });
    },
    onError(_error, variables) {
      toast.add({
        ...toastCustom.error,
        title: variables.action === 'cancel' ? 'Failed to cancel sale' : 'Failed to end sale',
      });
    },
  });
}
