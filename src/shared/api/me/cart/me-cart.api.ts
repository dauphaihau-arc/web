import type {
  AddProductToCartRequest,
  AddProductToCartResponse
  ,
  DeleteCartProductRequest,
  DeleteCartProductResponse
  ,
  GetCartRequest,
  GetCartResponse
  ,
  UpdateCartRequest,
  UpdateCartResponse
} from './contracts/cart.contract';
import { apiClient } from '~/shared/lib/api-client';

export const meCartApi = {
  add(payload: AddProductToCartRequest) {
    return apiClient.post<AddProductToCartResponse>(
      '/me/cart',
      payload
    );
  },

  get(params?: GetCartRequest) {
    return apiClient.get<GetCartResponse>(
      '/me/cart',
      params
    );
  },

  remove(params: DeleteCartProductRequest) {
    return apiClient.delete<DeleteCartProductResponse>(
      '/me/cart',
      params,
      undefined
    );
  },

  update(payload: UpdateCartRequest) {
    return apiClient.patch<UpdateCartResponse>(
      '/me/cart',
      payload
    );
  },
};
