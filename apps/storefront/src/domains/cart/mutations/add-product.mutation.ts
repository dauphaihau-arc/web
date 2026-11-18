import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/domains/cart/api/cart.api';
import type {
  AddProductToCartRequest,
  AddProductToCartResponse,
} from '~/domains/cart/api/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';
import { useErrorCopy } from '~/shared/composables/use-error-copy';
import { reportApiError } from '~/shared/utils/api-error-copy';

export function useAddProductToCart(
  options?: MutationOptions<
    AddProductToCartResponse,
    FetchError,
    AddProductToCartRequest
  > & {
    showErrorToast?: boolean
  },
) {
  const toast = useToast();
  const t = useErrorCopy();
  const showErrorToast = options?.showErrorToast ?? true;

  return useMutation({
    onError(error) {
      if (!showErrorToast) {
        return;
      }

      reportApiError(error, 'add-product-to-cart');

      toast.add({
        ...toastCustom.error,
        title: t('errors.cart.addFailed'),
      });
    },
    ...options,
    mutationKey: ['add-to-cart'],
    mutationFn: (body: AddProductToCartRequest) => cartApi.add(body),
  });
}
