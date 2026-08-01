import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopOrderApi } from '~/domains/shop/api/order/order.api';
import type { UpdateShopOrderRefundRequest } from '~/domains/shop/api/order/contracts/order.contract';

export function useShopUpdateOrderRefund() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-update-order-refund'],
    mutationFn: async (input: { orderId: string, body: UpdateShopOrderRefundRequest }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.updateRefund(shopId, input.orderId, input.body);
    },
    onSuccess(_result, variables) {
      toast.add({
        ...toastCustom.success,
        title: 'Refund requested',
      });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shop-order-detail', variables.orderId] });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to request refund',
      });
    },
  });
}
