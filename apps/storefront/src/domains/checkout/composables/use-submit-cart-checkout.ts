import { consola } from 'consola';
import { MARKET_CONFIG } from '@arc/enums/market';
import { PaymentTypes } from '@arc/enums/order';
import { FetchError } from 'ofetch';
import { useCartStore } from '~/domains/cart/stores/cart.store';
import { useGetCart } from '~/domains/cart/queries/cart.query';
import { useCreateGuestCheckoutQuoteFromCart } from '~/domains/checkout/mutations/create-checkout-quote-from-cart.mutation';
import { useCreateGuestOrderFromCart } from '~/domains/checkout/mutations/create-order-from-cart.mutation';
import { getCheckoutFailureCopy, resolveCheckoutFailure } from '~/domains/checkout/utils/checkout-error';
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
    const quoteBody: CartCheckoutQuoteBody = isAuthenticated
      ? {
        user_address_id: 'id' in address ? address.id : '',
      }
      : {
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

    const additionInfoShopCarts = Array
      .from(cartStore.additionInfoShopCarts)
      .map(([shopId, value]) => ({
        shop_id: shopId,
        promo_codes: value.promoCodes,
        note: value.note,
      }))
      .filter((item) => {
        return item.note || item.promo_codes.length > 0;
      });

    if (additionInfoShopCarts.length > 0) {
      quoteBody.addition_info_shop_carts = additionInfoShopCarts;
    }

    return quoteBody;
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

  async function submitCartCheckout() {
    try {
      cartStore.stateCheckoutCart.isPendingCreateOrder = true;

      const address = cartStore.stateCheckoutCart.address;
      if (!address) {
        consola.error('addressId be undefined');
        throw new Error();
      }

      const isAuthenticated = !!dataUserAuth.value?.user;
      const quoteBody = createQuoteBody(isAuthenticated, address);

      const quote = isAuthenticated
        ? await createQuote(quoteBody as CreateCheckoutQuoteFromCartRequest)
        : await createGuestQuote(quoteBody as CreateGuestCheckoutQuoteFromCartRequest);

      const orderBody = createOrderBody(isAuthenticated, quote.quote_id);

      const result = isAuthenticated
        ? await createOrder(orderBody as CreateOrderFromCartRequest)
        : await createGuestOrder(orderBody as CreateGuestOrderFromCartRequest);

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
    submitCartCheckout,
  };
}
