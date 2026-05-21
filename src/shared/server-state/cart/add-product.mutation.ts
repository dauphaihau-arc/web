import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { cartApi } from '~/shared/api/cart/cart.api';
import type {
  AddProductToCartRequest,
  AddProductToCartResponse
} from '~/shared/api/cart/contracts/cart.contract';
import { toastCustom } from '~/shared/config/toast';

export function useAddProductToCart(
  options?: MutationOptions<
    AddProductToCartResponse,
    FetchError,
    AddProductToCartRequest
  >
) {
  const toast = useToast();
  return useMutation({
    onError() {
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
