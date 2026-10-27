import { useMutation } from '@tanstack/vue-query';
import type { UpdateAdminOrderRefundBody } from '../api/contracts/admin-orders.contract';
import { adminOrdersApi } from '../api/admin-orders.api';
import { ADMIN_ORDERS_LIST_KEY, adminOrderDetailKey, adminOrderFinancialBreakdownKey } from '../queries/query-keys';
import { readApiError } from '~/shared/lib/api-error';
import { toastCustom } from '~/shared/config/toast';

export function useAdminUpdateOrderRefund() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationKey: ['admin-order-update-refund'],
    mutationFn: (input: { orderId: string, body: UpdateAdminOrderRefundBody }) =>
      adminOrdersApi.updateRefund(input.orderId, input.body),
    onSuccess(result, variables) {
      toast.add({
        ...toastCustom.success,
        title: 'Refund updated',
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
        title: 'Failed to update refund',
        description: readApiError(error).message,
      });
    },
  });
}
