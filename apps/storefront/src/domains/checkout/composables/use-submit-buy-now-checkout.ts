import { consola } from 'consola';
import { MARKET_CONFIG } from '@arc/enums/market';
import { PaymentTypes } from '@arc/enums/order';
import { FetchError } from 'ofetch';
import { useCartStore } from '~/domains/cart/stores/cart.store';
import { useGetCart } from '~/domains/cart/queries/cart.query';
import { useCreateGuestCheckoutQuoteForBuyNow } from '~/domains/checkout/mutations/create-checkout-quote-buy-now.mutation';
import { useCreateGuestOrderForBuyNow } from '~/domains/checkout/mutations/create-order-buy-now.mutation';
import { getCheckoutFailureCopy, resolveCheckoutFailure } from '~/domains/checkout/utils/checkout-error';
import { useMarketStore } from '~/domains/market/stores/market.store';
import { useCheckoutSessionReadiness } from '~/domains/me/composables/use-checkout-session-readiness';
import { useCreateCheckoutQuoteForBuyNow } from '~/domains/me/mutations/orders/create-checkout-quote-buy-now.mutation';
import { useCreateOrderForBuyNow } from '~/domains/me/mutations/orders/create-order-buy-now.mutation';
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query';
import { ROUTES } from '~/shared/config/enums/routes';
import { toastCustom } from '~/shared/config/toast';
import { routes } from '~/shared/navigation/routes';
import { getBackendErrorMessage } from '~/shared/utils/backend-error';
import type { CheckoutAddress } from '~/domains/cart/stores/cart.store.types';
import type {
  CreateGuestCheckoutQuoteForBuyNowRequest,
  CreateGuestOrderForBuyNowRequest,
} from '~/domains/checkout/api/contracts/checkout.contract';
import type {
  CreateCheckoutQuoteForBuyNowRequest,
  CreateOrderForBuyNowRequest,
} from '~/domains/me/api/order/contracts/order.contract';

type BuyNowCheckoutQuoteBody = CreateCheckoutQuoteForBuyNowRequest | CreateGuestCheckoutQuoteForBuyNowRequest;
type BuyNowOrderBody = CreateOrderForBuyNowRequest | CreateGuestOrderForBuyNowRequest;

export function useSubmitBuyNowCheckout() {
  const cartStore = useCartStore();
  const marketStore = useMarketStore();
  const toast = useToast();
  const { data: dataUserAuth } = useGetCurrentUser();
  const route = useRoute();
  const tempCartId = route.query['c'] as string;
  const {
    refetch: getCart,
  } = useGetCart({ cart_id: tempCartId }, { enabled: false });

  const {
    mutateAsync: createOrder,
  } = useCreateOrderForBuyNow();
  const {
    mutateAsync: createGuestOrder,
  } = useCreateGuestOrderForBuyNow();
  const {
    mutateAsync: createQuote,
  } = useCreateCheckoutQuoteForBuyNow();
  const {
    mutateAsync: createGuestQuote,
  } = useCreateGuestCheckoutQuoteForBuyNow();

  const waitForCheckoutSessionUrl = useCheckoutSessionReadiness();

  function createQuoteBody(isAuthenticated: boolean, address: CheckoutAddress): BuyNowCheckoutQuoteBody {
    const quoteBody: BuyNowCheckoutQuoteBody = isAuthenticated
      ? {
        cart_id: tempCartId,
        user_address_id: 'id' in address ? address.id : '',
      }
      : {
        cart_id: tempCartId,
        shipping_address: {
          full_name: address.full_name,
          address_1: address.address_1,
          address_2: address.address_2,
          city: address.city,
          country: address.country,
          state: address.state,
          zip: address.zip,
          phone: address.phone,
        },
        presentment_currency: marketStore.guestPreferences?.currency || MARKET_CONFIG.BASE_CURRENCY,
      };

    if (cartStore.stateCheckoutNow.promoCodes.length > 0) {
      quoteBody.promo_codes = cartStore.stateCheckoutNow.promoCodes;
    }

    if (cartStore.stateCheckoutNow.note) {
      quoteBody.note = cartStore.stateCheckoutNow.note;
    }

    return quoteBody;
  }


  function createOrderBody(isAuthenticated: boolean, quoteId: string): BuyNowOrderBody {
    const baseOrderBody = {
      payment_type: cartStore.stateCheckoutNow.paymentType,
      quote_id: quoteId,
    };

    if (isAuthenticated) {
      return baseOrderBody;
    }

    return {
      ...baseOrderBody,
      guest: {
        email: cartStore.stateCheckoutNow.guestEmail,
      },
    };
  }


  async function submitBuyNowCheckout() {
    try {
      cartStore.stateCheckoutNow.isPendingCreateOrder = true;

      const address = cartStore.stateCheckoutNow.address;

      if (!address) {
        consola.error('addressId be undefined');
        throw new Error();
      }

      const isAuthenticated = !!dataUserAuth.value?.user;
      const quoteBody = createQuoteBody(isAuthenticated, address);
      const quote = isAuthenticated
        ? await createQuote(quoteBody as CreateCheckoutQuoteForBuyNowRequest)
        : await createGuestQuote(quoteBody as CreateGuestCheckoutQuoteForBuyNowRequest);
      const orderBody = createOrderBody(isAuthenticated, quote.quote_id);
      const result = isAuthenticated
        ? await createOrder(orderBody as CreateOrderForBuyNowRequest)
        : await createGuestOrder(orderBody as CreateGuestOrderForBuyNowRequest);

      if (orderBody.payment_type === PaymentTypes.CARD) {
        const checkoutSessionUrl = result.checkout_session_url ??
          (isAuthenticated && result.checkout_pending
            ? await waitForCheckoutSessionUrl(result.order_shops.map(orderShop => orderShop.id))
            : undefined);

        if (!checkoutSessionUrl) {
          consola.error('checkout_session_url be undefined', checkoutSessionUrl);
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
          guestEmail: cartStore.stateCheckoutNow.guestEmail,
          guestZip: cartStore.stateCheckoutNow.address?.zip,
          orderIds: guestOrderIds,
        }));
    }
    catch (error) {
      cartStore.stateCheckoutNow.isPendingCreateOrder = false;
      const checkoutFailure = resolveCheckoutFailure(error);
      const checkoutFailureCopy = getCheckoutFailureCopy(checkoutFailure);

      if (checkoutFailure !== 'unknown') {
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
    submitBuyNowCheckout,
  };
}
