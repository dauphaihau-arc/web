import type { components } from '@arc/schemas/api/generated/openapi';
import type { PaymentTypes } from '@arc/enums/order';

type ApiCreateGuestOrderFromCart = components['schemas']['CreateGuestOrderFromCartDto'];
type ApiCreateGuestOrderForBuyNow = components['schemas']['CreateGuestOrderForBuyNowDto'];

export type CreateGuestOrderResponse = components['schemas']['CreateOrderResponseDto'];
export type CheckoutQuoteResponse = components['schemas']['CheckoutQuoteResponseDto'];
export type CreateGuestCheckoutQuoteFromCartRequest =
  components['schemas']['CreateGuestCheckoutQuoteFromCartDto'];
export type CreateGuestCheckoutQuoteForBuyNowRequest =
  components['schemas']['CreateGuestCheckoutQuoteForBuyNowDto'];

/** The contract spells `payment_type` as a string enum; the app passes `PaymentTypes`. */
export type CreateGuestOrderFromCartRequest =
  Omit<ApiCreateGuestOrderFromCart, 'payment_type'> & { payment_type: PaymentTypes };
export type CreateGuestOrderForBuyNowRequest =
  Omit<ApiCreateGuestOrderForBuyNow, 'payment_type'> & { payment_type: PaymentTypes };

export type GetCheckoutOrderShopsBySessionResponse =
  components['schemas']['CheckoutSessionOrderResponseDto'];
