import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { meCartApi } from '~/shared/api/me/cart/me-cart.api';
import type { UpdateCartRequest, UpdateCartResponse } from '~/shared/api/me/cart/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';

export function useUpdateCart(
  options?: MutationOptions<UpdateCartResponse, FetchError, UpdateCartRequest>
) {
  const toast = useToast();
  return useMutation({
    onError() {
      toast.add({
        ...toastCustom.error,
        title: 'Update cart failed',
      });
    },
    ...options,
    mutationFn: (body: UpdateCartRequest) => {
      return meCartApi.update(body);
    },
  });
}
