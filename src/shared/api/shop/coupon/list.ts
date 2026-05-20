import type { ResponseBaseGetList } from '~/shared/types/common';
import type { Coupon, GetCouponsParams } from '~/shared/types/coupon';

export type ListShopCouponsRequest = GetCouponsParams;
export type ListShopCouponsResponse = ResponseBaseGetList<Coupon>;
