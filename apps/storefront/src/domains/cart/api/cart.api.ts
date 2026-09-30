import type {
  AddProductToCartRequest,
  AddProductToCartResponse,
  ApplyCartCouponRequest,
  ApplyCartCouponResponse,
  DeleteCartProductRequest,
  DeleteCartProductResponse,
  GetCartCouponsRequest,
  GetCartCouponsResponse,
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

  getCoupons(params: GetCartCouponsRequest) {
    return apiClient.get<GetCartCouponsResponse>(
      '/cart/coupons',
      params,
    );
  },

  applyCoupon(payload: ApplyCartCouponRequest) {
    return apiClient.post<ApplyCartCouponResponse>(
      '/cart/coupons/apply',
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
