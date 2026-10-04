import { log } from '@arc/lib';
import { MARKET_CONFIG } from '@arc/enums/market';
import { PaymentTypes } from '@arc/enums/order';
import { FetchError } from 'ofetch';
import { useCartStore } from '~/domains/cart/stores/cart.store';
import { useGetCart } from '~/domains/cart/queries/cart.query';
import { useCreateGuestCheckoutQuoteForBuyNow } from '~/domains/checkout/mutations/create-checkout-quote-buy-now.mutation';
import { useCreateGuestOrderForBuyNow } from '~/domains/checkout/mutations/create-order-buy-now.mutation';
import {
  getCheckoutFailureCopy,
  getDroppedPromoCodesToast,
  resolveCheckoutFailure,
} from '~/domains/checkout/utils/checkout-error';
import { buildBuyNowQuoteBody } from '~/domains/checkout/utils/checkout-quote-body';
import { buildPromoCodeRemovalNotices } from '~/domains/checkout/utils/reconcile-applied-promo-codes';
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
  CheckoutQuoteResponse,
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
    return buildBuyNowQuoteBody({
      isAuthenticated,
      address,
      guestCurrency: marketStore.guestPreferences?.currency || MARKET_CONFIG.BASE_CURRENCY,
      tempCartId,
      promoCodes: cartStore.stateCheckoutNow.promoCodes,
      note: cartStore.stateCheckoutNow.note,
    });
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


  /**
   * The server refused to commit a quote whose totals no longer match current
   * prices. The stale acceptance is dropped and the review is re-quoted from
   * the refreshed prices, so the buyer sees the new total and has to confirm
   * the order again instead of being charged a silently different amount.
   */
  async function refreshAcceptedQuote(): Promise<string[]> {
    const address = cartStore.stateCheckoutNow.address;

    cartStore.stateCheckoutNow.quote = null;
    cartStore.promoCodeRemovalNotices.clear();

    await getCart();

    if (!address) {
      return [];
    }

    const isAuthenticated = !!dataUserAuth.value?.user;

    let refreshedQuote: CheckoutQuoteResponse;

    try {
      refreshedQuote = isAuthenticated
        ? await createQuote(createQuoteBody(isAuthenticated, address) as CreateCheckoutQuoteForBuyNowRequest)
        : await createGuestQuote(createQuoteBody(isAuthenticated, address) as CreateGuestCheckoutQuoteForBuyNowRequest);
    }
    catch {
      cartStore.stateCheckoutNow.quote = null;
      return [];
    }

    cartStore.stateCheckoutNow.quote = refreshedQuote;

    // Buy-now quotes one shop, so a code survives if any accepted shop kept it.
    // The quote silently drops a code it can no longer accept, so the applied
    // set is reconciled to what it accepted rather than left showing a discount
    // the totals no longer include.
    const acceptedCodes = new Set(
      refreshedQuote.shops.flatMap(shop => shop.promo_codes),
    );
    const droppedCodes = cartStore.stateCheckoutNow.promoCodes.filter(
      code => !acceptedCodes.has(code),
    );

    cartStore.stateCheckoutNow.promoCodes = cartStore.stateCheckoutNow.promoCodes.filter(
      code => acceptedCodes.has(code),
    );

    const noticeShopId = refreshedQuote.shops[0]?.shop_id;

    if (droppedCodes.length > 0 && noticeShopId) {
      cartStore.promoCodeRemovalNotices.set(
        noticeShopId,
        buildPromoCodeRemovalNotices(droppedCodes),
      );
    }

    return droppedCodes;
  }

  async function submitBuyNowCheckout() {
    try {
      cartStore.stateCheckoutNow.isPendingCreateOrder = true;

      const address = cartStore.stateCheckoutNow.address;

      if (!address) {
        log.error('addressId be undefined');
        throw new Error();
      }

      const isAuthenticated = !!dataUserAuth.value?.user;
      const acceptedQuote = cartStore.stateCheckoutNow.quote;
      const quoteId = acceptedQuote
        ? acceptedQuote.quote_id
        : (await (isAuthenticated
          ? createQuote(createQuoteBody(isAuthenticated, address) as CreateCheckoutQuoteForBuyNowRequest)
          : createGuestQuote(createQuoteBody(isAuthenticated, address) as CreateGuestCheckoutQuoteForBuyNowRequest)
        )).quote_id;
      const orderBody = createOrderBody(isAuthenticated, quoteId);
      const result = isAuthenticated
        ? await createOrder(orderBody as CreateOrderForBuyNowRequest)
        : await createGuestOrder(orderBody as CreateGuestOrderForBuyNowRequest);

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
          guestEmail: cartStore.stateCheckoutNow.guestEmail,
          guestZip: cartStore.stateCheckoutNow.address?.zip,
          orderIds: guestOrderIds,
        }));
    }
    catch (error) {
      cartStore.stateCheckoutNow.isPendingCreateOrder = false;
      const checkoutFailure = resolveCheckoutFailure(error);
      const checkoutFailureCopy = getCheckoutFailureCopy(checkoutFailure);

      const droppedPromoCodes = checkoutFailure === 'prices_changed'
        ? await refreshAcceptedQuote()
        : [];

      if (checkoutFailure !== 'unknown' && checkoutFailure !== 'prices_changed') {
        await getCart();
      }

      const backendMessage = getBackendErrorMessage(error);

      const droppedPromoCodesCopy = getDroppedPromoCodesToast(droppedPromoCodes);

      toast.add({
        ...toastCustom.error,
        title: droppedPromoCodesCopy?.title ?? checkoutFailureCopy.title,
        description: droppedPromoCodesCopy?.description ?? checkoutFailureCopy.description ??
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
