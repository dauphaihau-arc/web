import type { PaymentTypes } from '@arc/enums/order'
import type { GuestCheckoutAddress } from '@arc/schemas/guest-checkout.schema'
import type { GetUserAddressesResponse } from '~/shared/api/me/address/contracts/address.contract'

type UserAddress = GetUserAddressesResponse['results'][number]
type CouponCode = string
type CartId = string
export type CheckoutAddress = UserAddress | GuestCheckoutAddress

export enum CheckoutNowSteps {
  ADDRESS_SHIPPING,
  PAYMENT,
  REVIEW_CONFIRMATION,
  ORDER,
}

export type StateCheckoutNow = {
  tempCartId?: CartId
  currentStep: CheckoutNowSteps
  promoCodes: CouponCode[]
  note: string
  invalidCodes: Map<CouponCode, string>
  countRefreshConvertCurrency: number
  paymentType: PaymentTypes
  address: CheckoutAddress | null
  guestEmail: string
  isPendingCreateOrder: boolean
}

export enum CheckoutCartSteps {
  ADDRESS_SHIPPING,
  PAYMENT,
  REVIEW_CONFIRMATION,
  ORDER,
}

export type StateCheckoutCart = {
  currentStep: CheckoutCartSteps
  invalidCodes: Map<CouponCode, string>
  countRefreshConvertCurrency: number
  paymentType: PaymentTypes
  address: CheckoutAddress | null
  guestEmail: string
  isPendingCreateOrder: boolean
}
