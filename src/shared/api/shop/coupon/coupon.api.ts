import type {
  CreateShopCouponRequest,
  CreateShopCouponResponse
} from './create';
import type { DeleteShopCouponResponse } from './delete';
import type { ListShopCouponsRequest, ListShopCouponsResponse } from './list';
import { apiClient } from '~/shared/lib/api-client';

export const shopCouponApi = {
  create(shopId: string, payload: CreateShopCouponRequest) {
    return apiClient.post<CreateShopCouponResponse>(
      `/shops/${shopId}/coupons`,
      payload
    );
  },

  delete(shopId: string, couponId: string) {
    return apiClient.delete<DeleteShopCouponResponse>(
      `/shops/${shopId}/coupons/${couponId}`
    );
  },

  list(shopId: string, query?: ListShopCouponsRequest) {
    return apiClient.get<ListShopCouponsResponse>(
      `/shops/${shopId}/coupons`,
      query
    );
  },
};
