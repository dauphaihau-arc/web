import type { PaymentTypes } from '~/shared/config/enums/order';
import type { GetUserAddressesResponse } from '~/shared/api/me/address/contracts/address.contract';
import type { GuestCheckoutAddress } from '~/shared/schemas/guest-checkout.schema';

type UserAddress = GetUserAddressesResponse['results'][number];
type CouponCode = string;
type CartId = string;
export type CheckoutAddress = UserAddress | GuestCheckoutAddress;

export enum CheckoutNowSteps {
  ADDRESS_SHIPPING,
  PAYMENT,
  REVIEW_CONFIRMATION,
  ORDER
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
};

export enum CheckoutCartSteps {
  ADDRESS_SHIPPING,
  PAYMENT,
  REVIEW_CONFIRMATION,
  ORDER
}

export type StateCheckoutCart = {
  currentStep: CheckoutCartSteps
  invalidCodes: Map<CouponCode, string>
  countRefreshConvertCurrency: number
  paymentType: PaymentTypes
  address: CheckoutAddress | null
  guestEmail: string
  isPendingCreateOrder: boolean
};
