import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/domains/cart/api/cart.api';
import type {
  AddProductToCartRequest,
  AddProductToCartResponse
} from '~/domains/cart/api/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';

export function useAddProductToCart(
  options?: MutationOptions<
    AddProductToCartResponse,
    FetchError,
    AddProductToCartRequest
  > & {
    showErrorToast?: boolean
  }
) {
  const toast = useToast();
  const showErrorToast = options?.showErrorToast ?? true;

  return useMutation({
    onError() {
      if (!showErrorToast) {
        return;
      }

      toast.add({
        ...toastCustom.error,
        title: 'Add product to cart failed',
      });
    },
    ...options,
    mutationKey: ['add-to-cart'],
    mutationFn: (body: AddProductToCartRequest) => cartApi.add(body),
  });
}
