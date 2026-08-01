import { getBackendErrorCode, getBackendErrorMessage } from '~/shared/utils/backend-error';

export type CheckoutFailureKind =
  | 'quote_expired'
  | 'cart_changed'
  | 'stock_unavailable'
  | 'reservation_unavailable'
  | 'unknown';

export function resolveCheckoutFailure(error: unknown): CheckoutFailureKind {
  const backendCode = getBackendErrorCode(error);

  switch (backendCode) {
    case 'CHECKOUT_QUOTE_EXPIRED':
      return 'quote_expired';
    case 'CHECKOUT_QUOTE_CART_CHANGED':
      return 'cart_changed';
    case 'CHECKOUT_QUOTE_RESERVATION_OUT_OF_STOCK':
      return 'stock_unavailable';
    case 'CHECKOUT_QUOTE_RESERVATION_UNAVAILABLE':
      return 'reservation_unavailable';
  }

  const backendMessage = getBackendErrorMessage(error)?.toLowerCase() ?? '';

  if (backendMessage.includes('checkout quote expired')) {
    return 'quote_expired';
  }
  if (backendMessage.includes('no longer matches the selected cart items')) {
    return 'cart_changed';
  }
  if (backendMessage.includes('insufficient stock to reserve')) {
    return 'stock_unavailable';
  }
  if (backendMessage.includes('inventory reservation is no longer available')) {
    return 'reservation_unavailable';
  }

  return 'unknown';
}

export function getCheckoutFailureCopy(kind: CheckoutFailureKind): {
  title: string
  description?: string
} {
  switch (kind) {
    case 'quote_expired':
      return {
        title: 'Quote expired',
        description: 'Your checkout quote expired. Review the latest totals and try again.',
      };
    case 'cart_changed':
      return {
        title: 'Cart changed',
        description: 'Your items or totals changed since review. We refreshed checkout for you.',
      };
    case 'stock_unavailable':
      return {
        title: 'Stock no longer reservable',
        description: 'Some items are no longer available in the requested quantity. Review the updated cart.',
      };
    case 'reservation_unavailable':
      return {
        title: 'Reserved stock was released',
        description: 'Your reserved inventory is no longer available. Review the refreshed checkout and try again.',
      };
    default:
      return {
        title: 'Create order failed',
      };
  }
}
