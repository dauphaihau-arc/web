import type { Coupon } from '~/shared/models/coupon';
import type { ResponseBaseGetList } from '~/shared/contracts/common';
import type { GetCouponsParams } from './form';

export type ListShopCouponsRequest = GetCouponsParams;
export type ListShopCouponsResponse = ResponseBaseGetList<Coupon>;
