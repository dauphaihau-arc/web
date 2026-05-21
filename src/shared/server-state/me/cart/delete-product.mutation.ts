import type { MutationOptions } from '@tanstack/vue-query';
import { meCartApi } from '~/shared/api/me/cart/me-cart.api';
import type { DeleteCartProductResponse } from '~/shared/api/me/cart/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';

export function useDeleteProductCart(
  id: string,
  options?: MutationOptions<DeleteCartProductResponse>
) {
  const toast = useToast();
  return useMutation({
    onError: () => {
      toast.add({
        ...toastCustom.error,
        title: 'Delete product cart failed',
      });
    },
    ...options,
    mutationFn: () => {
      return meCartApi.remove({ inventory_id: id });
    },
  });
}
