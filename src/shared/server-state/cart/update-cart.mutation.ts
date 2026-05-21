import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/shared/api/cart/cart.api';
import type { UpdateCartRequest, UpdateCartResponse } from '~/shared/api/cart/contracts/cart.contract';
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
    mutationFn: (body: UpdateCartRequest) => cartApi.update(body),
  });
}
