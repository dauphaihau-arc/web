import type { Coupon } from '~/types/coupon';
import type { PAYMENT_TYPES } from '~/config/enums/order';
import type { UserAddress } from '~/types/user-address';

export enum CHECKOUT_CART_STEPS { ADDRESS_SHIPPING, PAYMENT, REVIEW_CONFIRMATION, ORDER }

export type StateCheckoutCart = {
  currentStep: CHECKOUT_CART_STEPS
  invalidCodes: Map<Coupon['code'], string>
  countRefreshConvertCurrency: number
  paymentType: PAYMENT_TYPES
  address: UserAddress | null
  isPendingCreateOrder: boolean
};
