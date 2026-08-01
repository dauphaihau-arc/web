import { resolveMyShopId } from '../utils/resolve-my-shop-id';
import { toastCustom } from '~/shared/config/toast';
import { shopOrderApi } from '~/domains/shop/api/order/order.api';
import type { UpdateShopOrderShipmentRequest } from '~/domains/shop/api/order/contracts/order.contract';

export function useShopUpdateOrderShipment() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['shop-update-order-shipment'],
    mutationFn: async (input: { orderId: string, body: UpdateShopOrderShipmentRequest }) => {
      const shopId = await resolveMyShopId(queryClient);
      return await shopOrderApi.updateShipment(shopId, input.orderId, input.body);
    },
    onSuccess(_result, variables) {
      toast.add({
        ...toastCustom.success,
        title: 'Shipment updated',
      });
      queryClient.invalidateQueries({ queryKey: ['shop-orders'] });
      queryClient.invalidateQueries({ queryKey: ['shop-order-detail', variables.orderId] });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to update shipment',
      });
    },
  });
}
