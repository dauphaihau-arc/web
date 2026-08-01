import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/domains/cart/api/cart.api';
import type { UpdateCartRequest, UpdateCartResponse } from '~/domains/cart/api/contracts/cart.contract';
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
