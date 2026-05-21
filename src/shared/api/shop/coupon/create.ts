import type { Coupon } from '~/shared/models/coupon';
import type { CreatePromoCodeBody, CreateSaleBody } from './form';

export type CreateShopCouponRequest = CreatePromoCodeBody | CreateSaleBody;

export type CreateShopCouponResponse = {
  coupon: Coupon
};
