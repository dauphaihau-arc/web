import { MARKET_CONFIG } from '@arc/enums/market';
import { useCartStore } from '~/domains/cart/stores/cart.store';
import { useCreateGuestCheckoutQuoteForBuyNow } from '~/domains/checkout/mutations/create-checkout-quote-buy-now.mutation';
import { useCreateGuestCheckoutQuoteFromCart } from '~/domains/checkout/mutations/create-checkout-quote-from-cart.mutation';
import { buildBuyNowQuoteBody, buildCartQuoteBody } from '~/domains/checkout/utils/checkout-quote-body';
import { useMarketStore } from '~/domains/market/stores/market.store';
import { useCreateCheckoutQuoteForBuyNow } from '~/domains/me/mutations/orders/create-checkout-quote-buy-now.mutation';
import { useCreateCheckoutQuoteFromCart } from '~/domains/me/mutations/orders/create-checkout-quote-from-cart.mutation';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import type {
  CheckoutQuoteResponse,
  CreateCheckoutQuoteForBuyNowRequest,
  CreateCheckoutQuoteFromCartRequest,
} from '~/domains/me/api/order/contracts/order.contract';
import type {
  CreateGuestCheckoutQuoteForBuyNowRequest,
  CreateGuestCheckoutQuoteFromCartRequest,
} from '~/domains/checkout/api/contracts/checkout.contract';

/**
 * Requests the server-computed checkout quote the buyer reviews. The quote
 * carries the accepted per-shop Shipping Charge and seller estimate, so review
 * display and order submission consume one server answer instead of deriving
 * money or delivery dates in the browser.
 */
export function useRequestCheckoutQuote(options: {
  mode: 'cart' | 'buy-now'
  tempCartId?: string
}) {
  const cartStore = useCartStore();
  const marketStore = useMarketStore();
  const { data: dataUserAuth } = useGetCurrentUser();

  const { mutateAsync: createCartQuote } = useCreateCheckoutQuoteFromCart();
  const { mutateAsync: createGuestCartQuote } = useCreateGuestCheckoutQuoteFromCart();
  const { mutateAsync: createBuyNowQuote } = useCreateCheckoutQuoteForBuyNow();
  const { mutateAsync: createGuestBuyNowQuote } = useCreateGuestCheckoutQuoteForBuyNow();

  const state = computed(() => options.mode === 'cart'
    ? cartStore.stateCheckoutCart
    : cartStore.stateCheckoutNow);

  const quote = computed<CheckoutQuoteResponse | null>(() => state.value.quote);
  const isPendingQuote = computed(() => state.value.isPendingQuote);

  async function requestQuote(): Promise<CheckoutQuoteResponse | undefined> {
    const checkoutState = state.value;
    const address = checkoutState.address;

    if (!address) {
      return undefined;
    }

    const isAuthenticated = !!dataUserAuth.value?.user;
    const guestCurrency = marketStore.guestPreferences?.currency || MARKET_CONFIG.BASE_CURRENCY;
    checkoutState.isPendingQuote = true;

    try {
      const result = options.mode === 'cart'
        ? (isAuthenticated
          ? await createCartQuote(buildCartQuoteBody({
            isAuthenticated,
            address,
            guestCurrency,
            additionInfoShopCarts: cartStore.additionInfoShopCarts,
          }) as CreateCheckoutQuoteFromCartRequest)
          : await createGuestCartQuote(buildCartQuoteBody({
            isAuthenticated,
            address,
            guestCurrency,
            additionInfoShopCarts: cartStore.additionInfoShopCarts,
          }) as CreateGuestCheckoutQuoteFromCartRequest))
        : (isAuthenticated
          ? await createBuyNowQuote(buildBuyNowQuoteBody({
            isAuthenticated,
            address,
            guestCurrency,
            tempCartId: options.tempCartId,
            promoCodes: cartStore.stateCheckoutNow.promoCodes,
            note: cartStore.stateCheckoutNow.note,
          }) as CreateCheckoutQuoteForBuyNowRequest)
          : await createGuestBuyNowQuote(buildBuyNowQuoteBody({
            isAuthenticated,
            address,
            guestCurrency,
            tempCartId: options.tempCartId,
            promoCodes: cartStore.stateCheckoutNow.promoCodes,
            note: cartStore.stateCheckoutNow.note,
          }) as CreateGuestCheckoutQuoteForBuyNowRequest));

      checkoutState.quote = result;
      return result;
    }
    catch (error) {
      checkoutState.quote = null;
      throw error;
    }
    finally {
      checkoutState.isPendingQuote = false;
    }
  }

  function clearQuote() {
    state.value.quote = null;
  }

  return {
    quote,
    isPendingQuote,
    requestQuote,
    clearQuote,
  };
}
