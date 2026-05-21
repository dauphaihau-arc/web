import type { MutationOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { meCartApi } from '~/shared/api/me/cart/me-cart.api';
import type { AddProductToCartRequest, AddProductToCartResponse } from '~/shared/api/me/cart/contracts/cart.contract';
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
    mutationFn: (body: AddProductToCartRequest) => {
      return meCartApi.add(body);
    },
  });
}
