import type {
  AddProductToCartRequest,
  AddProductToCartResponse,
  ApplyCartPromoCodeRequest,
  ApplyCartPromoCodeResponse,
  DeleteCartProductRequest,
  DeleteCartProductResponse,
  GetCartPromoCodesRequest,
  GetCartPromoCodesResponse,
  GetCartRequest,
  GetCartResponse,
  UpdateCartRequest,
  UpdateCartResponse,
} from './contracts/cart.contract';
import { apiClient } from '~/domains/_shared/api-client';

export const cartApi = {
  add(payload: AddProductToCartRequest) {
    return apiClient.post<AddProductToCartResponse>(
      '/cart/items',
      payload,
    );
  },

  get(params?: GetCartRequest) {
    return apiClient.get<GetCartResponse>(
      '/cart',
      params,
    );
  },

  getPromoCodes(params: GetCartPromoCodesRequest) {
    return apiClient.get<GetCartPromoCodesResponse>(
      '/cart/promo-codes',
      params,
    );
  },

  applyPromoCode(payload: ApplyCartPromoCodeRequest) {
    return apiClient.post<ApplyCartPromoCodeResponse>(
      '/cart/promo-codes/apply',
      payload,
    );
  },

  remove(params: DeleteCartProductRequest) {
    return apiClient.delete<DeleteCartProductResponse>(
      '/cart/items',
      params,
      undefined,
    );
  },

  update(payload: UpdateCartRequest) {
    return apiClient.patch<UpdateCartResponse>(
      '/cart/items',
      payload,
    );
  },

  merge() {
    return apiClient.post<GetCartResponse>(
      '/cart/merge',
    );
  },
};
