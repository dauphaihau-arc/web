import type {
  AddProductToCartRequest,
  AddProductToCartResponse
} from './add-product';
import type {
  DeleteCartProductRequest,
  DeleteCartProductResponse
} from './delete-product';
import type {
  GetCartRequest,
  GetCartResponse
} from './get-cart';
import type {
  UpdateCartRequest,
  UpdateCartResponse
} from './update-cart';
import { apiClient } from '~/shared/lib/api-client';

export const meCartApi = {
  add(payload: AddProductToCartRequest) {
    return apiClient.post<AddProductToCartResponse>(
      '/user/cart',
      payload
    );
  },

  get(params?: GetCartRequest) {
    return apiClient.get<GetCartResponse>(
      '/user/cart',
      params
    );
  },

  remove(params: DeleteCartProductRequest) {
    return apiClient.delete<DeleteCartProductResponse>(
      '/user/cart',
      params,
      undefined
    );
  },

  update(payload: UpdateCartRequest) {
    return apiClient.patch<UpdateCartResponse>(
      '/user/cart',
      payload
    );
  },
};
