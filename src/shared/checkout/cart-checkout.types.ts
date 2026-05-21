import type { Coupon } from '~/shared/models/coupon';
import type { PaymentTypes } from '~/shared/config/enums/order';
import type { UserAddress } from '~/shared/models/user-address';

export enum CheckoutCartSteps {
  addressShipping,
  payment,
  reviewConfirmation,
  order
}

export type StateCheckoutCart = {
  currentStep: CheckoutCartSteps
  invalidCodes: Map<Coupon['code'], string>
  countRefreshConvertCurrency: number
  paymentType: PaymentTypes
  address: UserAddress | null
  isPendingCreateOrder: boolean
};
