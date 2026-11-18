import type { MutationOptions } from '@tanstack/vue-query';
import { cartApi } from '~/domains/cart/api/cart.api';
import type { DeleteCartProductResponse } from '~/domains/cart/api/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';
import { useErrorCopy } from '~/shared/composables/use-error-copy';
import { reportApiError } from '~/shared/utils/api-error-copy';

export function useDeleteProductCart(
  id: string,
  options?: MutationOptions<DeleteCartProductResponse>,
) {
  const toast = useToast();
  const t = useErrorCopy();
  return useMutation({
    onError: (error) => {
      reportApiError(error, 'delete-cart-product');

      toast.add({
        ...toastCustom.error,
        title: t('errors.cart.deleteFailed'),
      });
    },
    ...options,
    mutationFn: () => cartApi.remove({ inventory_id: id }),
  });
}
