import { meOrdersApi } from '~/shared/api/me/order/me-orders.api';
import type { RequestOrderSupportRequest } from '~/shared/api/me/order/contracts/order.contract';
import { toastCustom } from '~/shared/config/toast';

export function useRequestOrderSupport() {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['request-order-support'],
    mutationFn: async (input: { orderId: string, body: RequestOrderSupportRequest }) => {
      return await meOrdersApi.requestSupport(input.orderId, input.body);
    },
    onSuccess(_data, variables) {
      toast.add({
        ...toastCustom.success,
        title: 'Support request sent',
      });
      queryClient.invalidateQueries({ queryKey: ['get-order-shops'] });
      queryClient.invalidateQueries({ queryKey: ['get-order-by-id', variables.orderId] });
    },
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Support request failed',
      });
    },
  });
}
