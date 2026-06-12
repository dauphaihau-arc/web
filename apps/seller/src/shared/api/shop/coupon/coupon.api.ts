import type {
  BulkDeleteShopCouponsRequest,
  BulkDeleteShopCouponsResponse,
  CreateShopCouponRequest,
  CreateShopCouponResponse
  ,
  DeleteShopCouponResponse,
  ListShopCouponsRequest,
  ListShopCouponsResponse
} from './contracts/coupon.contract';
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

  bulkDelete(shopId: string, payload: BulkDeleteShopCouponsRequest) {
    return apiClient.post<BulkDeleteShopCouponsResponse>(
      `/shops/${shopId}/coupons/bulk-delete`,
      payload
    );
  },

  list(shopId: string, query?: ListShopCouponsRequest) {
    return apiClient.get<ListShopCouponsResponse>(
      `/shops/${shopId}/coupons`,
      query
    );
  },
};
