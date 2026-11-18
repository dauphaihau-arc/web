import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/domains/cart/api/cart.api';
import type { UpdateCartRequest, UpdateCartResponse } from '~/domains/cart/api/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';
import { useErrorCopy } from '~/shared/composables/use-error-copy';
import { reportApiError } from '~/shared/utils/api-error-copy';

export function useUpdateCart(
  options?: MutationOptions<UpdateCartResponse, FetchError, UpdateCartRequest>,
) {
  const toast = useToast();
  const t = useErrorCopy();
  return useMutation({
    onError(error) {
      reportApiError(error, 'update-cart');

      toast.add({
        ...toastCustom.error,
        title: t('errors.cart.updateFailed'),
      });
    },
    ...options,
    mutationFn: (body: UpdateCartRequest) => cartApi.update(body),
  });
}
