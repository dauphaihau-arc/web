import type { AdditionInfoShopCarts } from '~/domains/cart/stores/cart.store';
import type { CheckoutAddress } from '~/domains/cart/stores/cart.store.types';
import type {
  CreateGuestCheckoutQuoteForBuyNowRequest,
  CreateGuestCheckoutQuoteFromCartRequest,
} from '~/domains/checkout/api/contracts/checkout.contract';
import type {
  CreateCheckoutQuoteForBuyNowRequest,
  CreateCheckoutQuoteFromCartRequest,
} from '~/domains/me/api/order/contracts/order.contract';

/**
 * The quote request is the single place checkout sends the buyer's address and
 * per-shop promo/note adjustments. Review display and order submission must
 * build the same body so the accepted quote is the one that gets charged.
 */
export function toGuestShippingAddress(address: CheckoutAddress) {
  return {
    full_name: address.full_name,
    address_1: address.address_1,
    address_2: address.address_2,
    city: address.city,
    country: address.country,
    state: address.state,
    zip: address.zip,
    phone: address.phone,
  };
}

function toShopCartAdjustments(
  additionInfoShopCarts: Map<string, AdditionInfoShopCarts['value']>,
) {
  return Array.from(additionInfoShopCarts)
    .map(([shopId, value]) => ({
      shop_id: shopId,
      promo_codes: value.promoCodes,
      note: value.note,
    }))
    .filter(item => item.note || item.promo_codes.length > 0);
}

export function buildCartQuoteBody(input: {
  isAuthenticated: boolean
  address: CheckoutAddress
  guestCurrency: string
  additionInfoShopCarts: Map<string, AdditionInfoShopCarts['value']>
}): CreateCheckoutQuoteFromCartRequest | CreateGuestCheckoutQuoteFromCartRequest {
  const quoteBody: CreateCheckoutQuoteFromCartRequest | CreateGuestCheckoutQuoteFromCartRequest = input.isAuthenticated
    ? {
      user_address_id: 'id' in input.address ? input.address.id : '',
    }
    : {
      shipping_address: toGuestShippingAddress(input.address),
      presentment_currency: input.guestCurrency,
    };

  const additionInfoShopCarts = toShopCartAdjustments(input.additionInfoShopCarts);
  if (additionInfoShopCarts.length > 0) {
    quoteBody.addition_info_shop_carts = additionInfoShopCarts;
  }

  return quoteBody;
}

export function buildBuyNowQuoteBody(input: {
  isAuthenticated: boolean
  address: CheckoutAddress
  guestCurrency: string
  tempCartId?: string
  promoCodes: string[]
  note: string
}): CreateCheckoutQuoteForBuyNowRequest | CreateGuestCheckoutQuoteForBuyNowRequest {
  const quoteBody: CreateCheckoutQuoteForBuyNowRequest | CreateGuestCheckoutQuoteForBuyNowRequest = input.isAuthenticated
    ? {
      cart_id: input.tempCartId ?? '',
      user_address_id: 'id' in input.address ? input.address.id : '',
    }
    : {
      cart_id: input.tempCartId ?? '',
      shipping_address: toGuestShippingAddress(input.address),
      presentment_currency: input.guestCurrency,
    };

  if (input.promoCodes.length > 0) {
    quoteBody.promo_codes = input.promoCodes;
  }

  if (input.note) {
    quoteBody.note = input.note;
  }

  return quoteBody;
}
