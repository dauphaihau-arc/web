import type {
  AddProductToCartRequest,
  AddProductToCartResponse,
  DeleteCartProductRequest,
  DeleteCartProductResponse,
  GetCartRequest,
  GetCartResponse,
  UpdateCartRequest,
  UpdateCartResponse
} from './contracts/cart.contract';
import { apiClient } from '~/shared/lib/api-client';

export const cartApi = {
  add(payload: AddProductToCartRequest) {
    return apiClient.post<AddProductToCartResponse>(
      '/cart/items',
      payload
    );
  },

  get(params?: GetCartRequest) {
    return apiClient.get<GetCartResponse>(
      '/cart',
      params
    );
  },

  remove(params: DeleteCartProductRequest) {
    return apiClient.delete<DeleteCartProductResponse>(
      '/cart/items',
      params,
      undefined
    );
  },

  update(payload: UpdateCartRequest) {
    return apiClient.patch<UpdateCartResponse>(
      '/cart/items',
      payload
    );
  },

  merge() {
    return apiClient.post<GetCartResponse>(
      '/cart/merge'
    );
  },
};
