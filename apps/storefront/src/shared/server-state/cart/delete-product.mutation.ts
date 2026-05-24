import type { MutationOptions } from '@tanstack/vue-query';
import { cartApi } from '~/shared/api/cart/cart.api';
import type { DeleteCartProductResponse } from '~/shared/api/cart/contracts/cart.contract';
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
    mutationFn: () => cartApi.remove({ inventory_id: id }),
  });
}
