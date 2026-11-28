import {
  getBackendErrorCode,
  getBackendErrorMessage,
} from '~/shared/utils/backend-error';
import {
  translateError,
  type ErrorCopy,
  type ErrorTranslator,
} from '~/shared/utils/api-error-copy';

export type CheckoutFailureKind =
  | 'quote_expired'
  | 'cart_changed'
  | 'prices_changed'
  | 'stock_unavailable'
  | 'reservation_unavailable'
  | 'shipping_unavailable'
  | 'checkout_session_pending'
  | 'unknown';

export function resolveCheckoutFailure(error: unknown): CheckoutFailureKind {
  const backendCode = getBackendErrorCode(error);

  switch (backendCode) {
    case 'CHECKOUT_QUOTE_EXPIRED':
      return 'quote_expired';
    case 'CHECKOUT_QUOTE_CART_CHANGED':
      return 'cart_changed';
    case 'CHECKOUT_QUOTE_PRICES_CHANGED':
      return 'prices_changed';
    case 'CHECKOUT_QUOTE_RESERVATION_OUT_OF_STOCK':
      return 'stock_unavailable';
    case 'CHECKOUT_QUOTE_RESERVATION_UNAVAILABLE':
      return 'reservation_unavailable';
    case 'CHECKOUT_SHIPPING_UNAVAILABLE':
      return 'shipping_unavailable';
  }
  const backendMessage = (getBackendErrorMessage(error) ?? (error instanceof Error ? error.message : '')).toLowerCase();

  if (backendMessage.includes('checkout quote expired')) {
    return 'quote_expired';
  }
  if (backendMessage.includes('no longer matches the selected cart items')) {
    return 'cart_changed';
  }
  if (backendMessage.includes('checkout totals changed')) {
    return 'prices_changed';
  }
  if (backendMessage.includes('insufficient stock to reserve')) {
    return 'stock_unavailable';
  }
  if (backendMessage.includes('inventory reservation is no longer available')) {
    return 'reservation_unavailable';
  }
  if (backendMessage.includes('checkout session is still being prepared')) {
    return 'checkout_session_pending';
  }

  return 'unknown';
}

/**
 * The toast copy for a commitment refused because the refreshed quote dropped
 * applied Promo Codes. It reads as a removed code rather than the generic
 * "prices changed", so the buyer knows what went and why the total moved.
 */
export function getDroppedPromoCodesToast(
  codes: readonly string[],
  t: ErrorTranslator = translateError,
): ErrorCopy | undefined {
  if (codes.length === 0) {
    return undefined;
  }

  const isPlural = codes.length > 1;
  const joinedCodes = codes.join(', ');

  return {
    title: t(isPlural ? 'errors.promo.removed.titlePlural' : 'errors.promo.removed.title'),
    description: t(
      isPlural ? 'errors.promo.removed.descriptionPlural' : 'errors.promo.removed.description',
      { codes: joinedCodes },
    ),
  };
}

export function getCheckoutFailureCopy(
  kind: CheckoutFailureKind,
  t: ErrorTranslator = translateError,
): ErrorCopy {
  switch (kind) {
    case 'quote_expired':
      return {
        title: t('errors.checkout.quoteExpired.title'),
        description: t('errors.checkout.quoteExpired.description'),
      };
    case 'cart_changed':
      return {
        title: t('errors.checkout.cartChanged.title'),
        description: t('errors.checkout.cartChanged.description'),
      };
    case 'prices_changed':
      return {
        title: t('errors.checkout.pricesChanged.title'),
        description: t('errors.checkout.pricesChanged.description'),
      };
    case 'stock_unavailable':
      return {
        title: t('errors.checkout.stockUnavailable.title'),
        description: t('errors.checkout.stockUnavailable.description'),
      };
    case 'reservation_unavailable':
      return {
        title: t('errors.checkout.reservationUnavailable.title'),
        description: t('errors.checkout.reservationUnavailable.description'),
      };
    case 'shipping_unavailable':
      return {
        title: t('errors.checkout.shippingUnavailable.title'),
        description: t('errors.checkout.shippingUnavailable.description'),
      };
    case 'checkout_session_pending':
      return {
        title: t('errors.checkout.sessionPending.title'),
        description: t('errors.checkout.sessionPending.description'),
      };
    default:
      return {
        title: t('errors.generic.title'),
        description: t('errors.generic.description'),
      };
  }
}
