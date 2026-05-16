import type { MutationOptions, UseQueryOptions } from '@tanstack/vue-query';
import type { FetchError } from 'ofetch';
import { RESOURCES } from '~/shared/config/enums/resources';
import type {
  AddProductToCartBody,
  ResponseGetCart,
  UpdateCartBody,
  ResponseUpdateCart,
  ResponseAddProductToCartBody,
  ResponseDeleteProductCart
} from '~/shared/types/request-api/cart';
import type { ProductInventory } from '~/shared/types/product';
import { toastCustom } from '~/shared/config/toast';
import { useGetCurrentUser } from '~/shared/server-state/user';
import type { Cart } from '~/shared/types/cart';

export function useGetCart(
  params?: { cartId: Cart['id'] },
  queryOptions?: Partial<UseQueryOptions<ResponseGetCart>>
) {
  const { data: dataUserAuth } = useGetCurrentUser();
  return useQuery<ResponseGetCart>({
    ...queryOptions,
    enabled: !!dataUserAuth.value?.user,
    queryKey: ['get-cart', params?.cartId ?? 'my-cart'],
    queryFn: () => {
      return useCustomFetch.get<ResponseGetCart>(
        `${RESOURCES.USER}${RESOURCES.CART}`,
        params ?? undefined
      );
    },
    retry: 1,
  });
}

export function useAddProductToCart(
  options?: MutationOptions<
    ResponseAddProductToCartBody,
    FetchError,
    AddProductToCartBody
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
    mutationFn: (body: AddProductToCartBody) => {
      return useCustomFetch.post<ResponseAddProductToCartBody>(
        `${RESOURCES.USER}${RESOURCES.CART}`,
        {
          inventoryId: body.inventoryId,
          quantity: body.quantity,
          isTemp: body.isTemp,
        }
      );
    },
  });
}

export function useUpdateCart(
  options?: MutationOptions<ResponseUpdateCart, FetchError, UpdateCartBody>
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
    mutationFn: (body: UpdateCartBody) => {
      return useCustomFetch.patch<ResponseUpdateCart>(
        `${RESOURCES.USER}${RESOURCES.CART}`,
        body
      );
    },
  });
}

export function useDeleteProductCart(
  id: ProductInventory['id'],
  options?: MutationOptions<ResponseDeleteProductCart>
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
    mutationFn: () => {
      return useCustomFetch.delete<ResponseDeleteProductCart>(
        `${RESOURCES.USER}${RESOURCES.CART}`,
        { inventoryId: id },
        undefined
      );
    },
  });
}
