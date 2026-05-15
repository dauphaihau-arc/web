import type { PaymentTypes } from '~/shared/config/enums/order';
import type { UserAddress } from '~/shared/types/user-address';
import type { Coupon } from '~/shared/types/coupon';
import type { Cart } from '~/shared/types/cart';

export enum CheckoutNowSteps {
  addressShipping,
  payment,
  reviewConfirmation,
  order
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
