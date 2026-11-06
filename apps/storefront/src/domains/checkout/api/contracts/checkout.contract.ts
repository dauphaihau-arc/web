import type { components } from '@arc/schemas/api/generated/openapi';
import type { PaymentTypes } from '@arc/enums/order';

type ApiCreateGuestOrderFromCart = components['schemas']['CreateGuestOrderFromCartDto'];
type ApiCreateGuestOrderForBuyNow = components['schemas']['CreateGuestOrderForBuyNowDto'];

export type CreateGuestOrderResponse = components['schemas']['CreateOrderResponseDto'];
export type CheckoutQuoteResponse = components['schemas']['CheckoutQuoteResponseDto'];

type ApiGuestShippingAddress = components['schemas']['ShippingAddressDto'];

/**
 * The guest address writes canonical country and subdivision codes. Display
 * names are server-derived response fields and are never accepted as input.
 */
export type GuestShippingAddressRequest =
  Omit<ApiGuestShippingAddress, 'country' | 'state'> & {
    country_code: string
    state_code?: string
    state_text?: string
  };

export type CreateGuestCheckoutQuoteFromCartRequest =
  Omit<components['schemas']['CreateGuestCheckoutQuoteFromCartDto'], 'shipping_address'> & {
    shipping_address: GuestShippingAddressRequest
  };
export type CreateGuestCheckoutQuoteForBuyNowRequest =
  Omit<components['schemas']['CreateGuestCheckoutQuoteForBuyNowDto'], 'shipping_address'> & {
    shipping_address: GuestShippingAddressRequest
  };

/** The contract spells `payment_type` as a string enum; the app passes `PaymentTypes`. */
export type CreateGuestOrderFromCartRequest =
  Omit<ApiCreateGuestOrderFromCart, 'payment_type'> & { payment_type: PaymentTypes };
export type CreateGuestOrderForBuyNowRequest =
  Omit<ApiCreateGuestOrderForBuyNow, 'payment_type'> & { payment_type: PaymentTypes };

export type GetCheckoutOrderShopsBySessionResponse =
  components['schemas']['CheckoutSessionOrderResponseDto'];
