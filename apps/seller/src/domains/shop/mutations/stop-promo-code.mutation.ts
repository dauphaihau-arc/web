import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopPromoCodeApi } from '~/domains/shop/api/promo-code/promo-code.api';

export type ShopPromoCodeStopAction = 'cancel' | 'end';

/**
 * Irreversibly stops one Promo Code: a scheduled Promo Code is cancelled, an
 * active one is ended early. Neither is a delete, so the list is refreshed
 * rather than having a row removed.
 */
export function useShopStopPromoCode() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-stop-promo-code'],
    mutationFn: async (payload: { promoCodeId: string, action: ShopPromoCodeStopAction }) => {
      const shopId = await resolveMyShopId(queryClient);

      return payload.action === 'cancel'
        ? shopPromoCodeApi.cancel(shopId, payload.promoCodeId)
        : shopPromoCodeApi.end(shopId, payload.promoCodeId);
    },
    onSuccess(_result, variables) {
      queryClient.invalidateQueries({ queryKey: ['shop-get-promo-codes'] });

      toast.add({
        ...toastCustom.success,
        title: variables.action === 'cancel' ? 'Promo code cancelled' : 'Promo code ended',
        description: variables.action === 'cancel'
          ? 'The scheduled promo code will never run. Its code identity, usages and order history are kept.'
          : 'The promo code ended early. Its code identity, usages and order history are kept.',
      });
    },
    onError(_error, variables) {
      toast.add({
        ...toastCustom.error,
        title: variables.action === 'cancel' ? 'Failed to cancel promo code' : 'Failed to end promo code',
      });
    },
  });
}
