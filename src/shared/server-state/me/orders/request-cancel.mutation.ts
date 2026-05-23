import { meOrdersApi } from '~/shared/api/me/order/me-orders.api';
import type { RequestOrderCancelRequest } from '~/shared/api/me/order/contracts/order.contract';
import { toastCustom } from '~/shared/config/toast';

export function useRequestOrderCancel() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['request-order-cancel'],
    mutationFn: async (input: { orderId: string, body: RequestOrderCancelRequest }) => {
      return await meOrdersApi.requestCancel(input.orderId, input.body);
    },
    onSuccess(_result, variables) {
      toast.add({
        ...toastCustom.success,
        title: 'Order canceled',
      });
      queryClient.invalidateQueries({ queryKey: ['get-order-shops'] });
      queryClient.invalidateQueries({ queryKey: ['get-order-by-id', variables.orderId] });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Unable to cancel this order',
      });
    },
  });
}
