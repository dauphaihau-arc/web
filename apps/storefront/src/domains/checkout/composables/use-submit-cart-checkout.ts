import { log } from '@arc/lib';
import { MARKET_CONFIG } from '@arc/enums/market';
import { PaymentTypes } from '@arc/enums/order';
import { FetchError } from 'ofetch';
import { useCartStore } from '~/domains/cart/stores/cart.store';
import { useGetCart } from '~/domains/cart/queries/cart.query';
import { useCreateGuestCheckoutQuoteFromCart } from '~/domains/checkout/mutations/create-checkout-quote-from-cart.mutation';
import { useCreateGuestOrderFromCart } from '~/domains/checkout/mutations/create-order-from-cart.mutation';
import { getCheckoutFailureCopy, resolveCheckoutFailure } from '~/domains/checkout/utils/checkout-error';
import { buildCartQuoteBody } from '~/domains/checkout/utils/checkout-quote-body';
import { useMarketStore } from '~/domains/market/stores/market.store';
import { useCheckoutSessionReadiness } from '~/domains/me/composables/use-checkout-session-readiness';
import { useCreateCheckoutQuoteFromCart } from '~/domains/me/mutations/orders/create-checkout-quote-from-cart.mutation';
import { useCreateOrderFromCart } from '~/domains/me/mutations/orders/create-order-from-cart.mutation';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { ROUTES } from '~/shared/config/enums/routes';
import { toastCustom } from '~/shared/config/toast';
import { routes } from '~/shared/navigation/routes';
import { getBackendErrorMessage } from '~/shared/utils/backend-error';
import type { CheckoutAddress } from '~/domains/cart/stores/cart.store.types';
import type {
  CreateGuestCheckoutQuoteFromCartRequest,
  CreateGuestOrderFromCartRequest,
} from '~/domains/checkout/api/contracts/checkout.contract';
import type {
  CreateCheckoutQuoteFromCartRequest,
  CreateOrderFromCartRequest,
} from '~/domains/me/api/order/contracts/order.contract';

type CartCheckoutQuoteBody = CreateCheckoutQuoteFromCartRequest | CreateGuestCheckoutQuoteFromCartRequest;
type CartOrderBody = CreateOrderFromCartRequest | CreateGuestOrderFromCartRequest;

export function useSubmitCartCheckout() {
  const marketStore = useMarketStore();
  const toast = useToast();
  const cartStore = useCartStore();
  const { data: dataUserAuth } = useGetCurrentUser();

  const {
    refetch: getCart,
  } = useGetCart(undefined, { enabled: false });

  const {
    mutateAsync: createOrder,
  } = useCreateOrderFromCart();
  const {
    mutateAsync: createGuestOrder,
  } = useCreateGuestOrderFromCart();
  const {
    mutateAsync: createQuote,
  } = useCreateCheckoutQuoteFromCart();
  const {
    mutateAsync: createGuestQuote,
  } = useCreateGuestCheckoutQuoteFromCart();

  const waitForCheckoutSessionUrl = useCheckoutSessionReadiness();

  function createQuoteBody(isAuthenticated: boolean, address: CheckoutAddress): CartCheckoutQuoteBody {
    return buildCartQuoteBody({
      isAuthenticated,
      address,
      guestCurrency: marketStore.guestPreferences?.currency || MARKET_CONFIG.BASE_CURRENCY,
      additionInfoShopCarts: cartStore.additionInfoShopCarts,
    });
  }

  function createOrderBody(isAuthenticated: boolean, quoteId: string): CartOrderBody {
    const baseOrderBody = {
      payment_type: cartStore.stateCheckoutCart.paymentType,
      quote_id: quoteId,
    };

    if (isAuthenticated) {
      return baseOrderBody;
    }

    return {
      ...baseOrderBody,
      guest: {
        email: cartStore.stateCheckoutCart.guestEmail,
      },
    };
  }

  /**
   * The server refused to commit a quote whose totals no longer match current
   * prices. The stale acceptance is dropped and the review is re-quoted from
   * the refreshed prices, so the buyer sees the new total and has to confirm
   * the order again instead of being charged a silently different amount.
   */
  async function refreshAcceptedQuote() {
    const address = cartStore.stateCheckoutCart.address;

    cartStore.stateCheckoutCart.quote = null;
    await getCart();

    if (!address) {
      return;
    }

    const isAuthenticated = !!dataUserAuth.value?.user;

    try {
      cartStore.stateCheckoutCart.quote = isAuthenticated
        ? await createQuote(createQuoteBody(isAuthenticated, address) as CreateCheckoutQuoteFromCartRequest)
        : await createGuestQuote(createQuoteBody(isAuthenticated, address) as CreateGuestCheckoutQuoteFromCartRequest);
    }
    catch {
      // A quote that cannot be produced leaves the review to the page's own
      // refresh path; the buyer never reaches commitment with the old totals.
      cartStore.stateCheckoutCart.quote = null;
    }
  }

  async function submitCartCheckout() {
    try {
      cartStore.stateCheckoutCart.isPendingCreateOrder = true;

      const address = cartStore.stateCheckoutCart.address;
      if (!address) {
        log.error('addressId be undefined');
        throw new Error();
      }

      const isAuthenticated = !!dataUserAuth.value?.user;

      const acceptedQuote = cartStore.stateCheckoutCart.quote;
      const quoteId = acceptedQuote
        ? acceptedQuote.quote_id
        : (await (isAuthenticated
          ? createQuote(createQuoteBody(isAuthenticated, address) as CreateCheckoutQuoteFromCartRequest)
          : createGuestQuote(createQuoteBody(isAuthenticated, address) as CreateGuestCheckoutQuoteFromCartRequest)
        )).quote_id;

      const orderBody = createOrderBody(isAuthenticated, quoteId);

      const result = isAuthenticated
        ? await createOrder(orderBody as CreateOrderFromCartRequest)
        : await createGuestOrder(orderBody as CreateGuestOrderFromCartRequest);

      if (orderBody.payment_type === PaymentTypes.CARD) {
        const checkoutSessionUrl = result.checkout_session_url ??
          (isAuthenticated && result.checkout_pending
            ? await waitForCheckoutSessionUrl(result.order_shops.map(orderShop => orderShop.id))
            : undefined);

        if (!checkoutSessionUrl) {
          log.error('checkout_session_url be undefined', checkoutSessionUrl);
          throw new Error();
        }

        navigateTo(checkoutSessionUrl, {
          external: true,
        });

        return;
      }

      cartStore.orderShops = result.order_shops;
      const guestOrderIds = result.order_shops.map(orderShop => orderShop.order_number).join(',');

      navigateTo(isAuthenticated
        ? ROUTES.SUCCESS
        : routes.success({
          guestEmail: cartStore.stateCheckoutCart.guestEmail,
          guestZip: cartStore.stateCheckoutCart.address?.zip,
          orderIds: guestOrderIds,
        }));

      void getCart();
    }
    catch (error) {
      cartStore.stateCheckoutCart.isPendingCreateOrder = false;
      const checkoutFailure = resolveCheckoutFailure(error);
      const checkoutFailureCopy = getCheckoutFailureCopy(checkoutFailure);

      if (checkoutFailure === 'prices_changed') {
        await refreshAcceptedQuote();
      }
      else if (checkoutFailure !== 'unknown') {
        await getCart();
      }

      const backendMessage = getBackendErrorMessage(error);

      toast.add({
        ...toastCustom.error,
        title: checkoutFailureCopy.title,
        description: checkoutFailureCopy.description ??
          (error instanceof FetchError && !backendMessage
            ? `Request failed with status ${error.status ?? 'unknown'}`
            : undefined),
        ...(checkoutFailure === 'unknown' && backendMessage
          ? { title: backendMessage }
          : {}),
        ...(error instanceof FetchError && !backendMessage
          && checkoutFailure === 'unknown'
          ? { description: `Request failed with status ${error.status ?? 'unknown'}` }
          : {}),
      });
    }
  }

  return {
    submitCartCheckout,
  };
}
