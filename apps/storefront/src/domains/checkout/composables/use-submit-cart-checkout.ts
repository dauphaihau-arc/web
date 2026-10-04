import { log } from '@arc/lib';
import { MARKET_CONFIG } from '@arc/enums/market';
import { PaymentTypes } from '@arc/enums/order';
import { FetchError } from 'ofetch';
import { useCartStore } from '~/domains/cart/stores/cart.store';
import { useGetCart } from '~/domains/cart/queries/cart.query';
import { useCreateGuestCheckoutQuoteFromCart } from '~/domains/checkout/mutations/create-checkout-quote-from-cart.mutation';
import { useCreateGuestOrderFromCart } from '~/domains/checkout/mutations/create-order-from-cart.mutation';
import {
  getCheckoutFailureCopy,
  getDroppedPromoCodesToast,
  resolveCheckoutFailure,
} from '~/domains/checkout/utils/checkout-error';
import { buildCartQuoteBody } from '~/domains/checkout/utils/checkout-quote-body';
import {
  buildPromoCodeRemovalNotices,
  findDroppedPromoCodes,
} from '~/domains/checkout/utils/reconcile-applied-promo-codes';
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
  CheckoutQuoteResponse,
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
  async function refreshAcceptedQuote(): Promise<string[]> {
    const address = cartStore.stateCheckoutCart.address;

    cartStore.stateCheckoutCart.quote = null;
    cartStore.promoCodeRemovalNotices.clear();

    await getCart();

    if (!address) {
      return [];
    }

    const isAuthenticated = !!dataUserAuth.value?.user;

    let refreshedQuote: CheckoutQuoteResponse;

    try {
      refreshedQuote = isAuthenticated
        ? await createQuote(createQuoteBody(isAuthenticated, address) as CreateCheckoutQuoteFromCartRequest)
        : await createGuestQuote(createQuoteBody(isAuthenticated, address) as CreateGuestCheckoutQuoteFromCartRequest);
    }
    catch {
      // A quote that cannot be produced leaves the review to the page's own
      // refresh path; the buyer never reaches commitment with the old totals.
      cartStore.stateCheckoutCart.quote = null;
      return [];
    }

    cartStore.stateCheckoutCart.quote = refreshedQuote;

    // The quote silently drops a code it can no longer accept, so the selection
    // is reconciled against what it accepted: the chips then match the totals,
    // and each dropped code is explained where it used to be shown.
    const droppedByShop = findDroppedPromoCodes(
      Array.from(cartStore.additionInfoShopCarts).map(([shopId, value]) => ({
        shopId,
        promoCodes: value.promoCodes,
      })),
      refreshedQuote.shops.map(shop => ({
        shopId: shop.shop_id,
        promoCodes: shop.promo_codes,
      })),
    );

    const droppedCodes: string[] = [];

    for (const [shopId, droppedCodesForShop] of droppedByShop) {
      const existing = cartStore.additionInfoShopCarts.get(shopId);

      cartStore.additionInfoShopCarts.set(shopId, {
        promoCodes: (existing?.promoCodes ?? []).filter(
          code => !droppedCodesForShop.includes(code),
        ),
        note: existing?.note ?? '',
      });
      cartStore.promoCodeRemovalNotices.set(
        shopId,
        buildPromoCodeRemovalNotices(droppedCodesForShop),
      );
      droppedCodes.push(...droppedCodesForShop);
    }

    return droppedCodes;
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
    submitCartCheckout,
  };
}
