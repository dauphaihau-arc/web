import type { PAYMENT_TYPES } from '~/shared/config/enums/order';
import type { UserAddress } from '~/shared/types/user-address';
import type { Coupon } from '~/shared/types/coupon';
import type { Cart } from '~/shared/types/cart';

export enum CHECKOUT_NOW_STEPS { ADDRESS_SHIPPING, PAYMENT, REVIEW_CONFIRMATION, ORDER }

export type StateCheckoutNow = {
  tempCartId?: Cart['id']
  currentStep: CHECKOUT_NOW_STEPS
  promoCodes: Coupon['code'][]
  note: string
  invalidCodes: Map<Coupon['code'], string>
  countRefreshConvertCurrency: number
  paymentType: PAYMENT_TYPES
  address: UserAddress | null
  isPendingCreateOrder: boolean
};
