import type { PaymentTypes } from '~/shared/config/enums/order';
import type { Cart } from '~/shared/models/cart';
import type { Coupon } from '~/shared/models/coupon';
import type { UserAddress } from '~/shared/models/user-address';

export enum CheckoutNowSteps {
  ADDRESS_SHIPPING,
  PAYMENT,
  REVIEW_CONFIRMATION,
  ORDER
}

export type StateCheckoutNow = {
  tempCartId?: Cart['id']
  currentStep: CheckoutNowSteps
  promoCodes: Coupon['code'][]
  note: string
  invalidCodes: Map<Coupon['code'], string>
  countRefreshConvertCurrency: number
  paymentType: PaymentTypes
  address: UserAddress | null
  isPendingCreateOrder: boolean
};

export enum CheckoutCartSteps {
  ADDRESS_SHIPPING,
  PAYMENT,
  REVIEW_CONFIRMATION,
  ORDER
}

export type StateCheckoutCart = {
  currentStep: CheckoutCartSteps
  invalidCodes: Map<Coupon['code'], string>
  countRefreshConvertCurrency: number
  paymentType: PaymentTypes
  address: UserAddress | null
  isPendingCreateOrder: boolean
};
