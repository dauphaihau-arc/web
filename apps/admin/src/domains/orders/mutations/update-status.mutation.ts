import { useMutation } from '@tanstack/vue-query';
import type { UpdateAdminOrderStatusBody } from '../api/contracts/admin-orders.contract';
import { adminOrdersApi } from '../api/admin-orders.api';
import { ADMIN_ORDERS_LIST_KEY, adminOrderDetailKey, adminOrderFinancialBreakdownKey } from '../queries/query-keys';
import { readApiError } from '~/shared/lib/api-error';
import { toastCustom } from '~/shared/config/toast';

export function useAdminUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['admin-order-update-status'],
    mutationFn: (input: { orderId: string, body: UpdateAdminOrderStatusBody }) =>
      adminOrdersApi.updateStatus(input.orderId, input.body),
    onSuccess(result, variables) {
      toast.add({
        ...toastCustom.success,
        title: 'Order updated',
      });
      queryClient.setQueryData(adminOrderDetailKey(variables.orderId), result);
      queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_LIST_KEY });
      queryClient.invalidateQueries({
        queryKey: adminOrderFinancialBreakdownKey(variables.orderId),
      });
    },
    onError(error) {
      toast.add({
        ...toastCustom.error,
        title: 'Failed to update order',
        description: readApiError(error).message,
      });
    },
  });
}
