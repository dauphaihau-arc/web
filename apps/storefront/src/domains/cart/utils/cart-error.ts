import {
  getBackendErrorCode,
  getBackendErrorMessage,
} from '~/shared/utils/backend-error';
import {
  translateError,
  type ErrorCopy,
  type ErrorTranslator,
} from '~/shared/utils/api-error-copy';

export type AddToCartFailureKind =
  | 'out_of_stock'
  | 'quantity_exceeds_stock'
  | 'product_unavailable'
  | 'inventory_not_found'
  | 'unknown';

export function resolveAddToCartFailure(error: unknown): AddToCartFailureKind {
  const backendCode = getBackendErrorCode(error);

  switch (backendCode) {
    case 'CART_QUANTITY_EXCEEDS_STOCK':
      return 'quantity_exceeds_stock';
    case 'PRODUCT_UNAVAILABLE_FOR_CART':
      return 'product_unavailable';
    case 'PRODUCT_INVENTORY_NOT_FOUND':
      return 'inventory_not_found';
  }

  const backendMessage = getBackendErrorMessage(error)?.toLowerCase() ?? '';

  if (backendMessage.includes('quantity of product exceeds stock')) {
    return 'quantity_exceeds_stock';
  }
  if (backendMessage.includes('product is not available for cart operations')) {
    return 'product_unavailable';
  }
  if (backendMessage.includes('inventory') && backendMessage.includes('was not found')) {
    return 'inventory_not_found';
  }
  if (backendMessage.includes('out of stock')) {
    return 'out_of_stock';
  }

  return 'unknown';
}

/**
 * Localized copy for an add-to-cart or buy-now refusal. The stock and
 * availability kinds map to known codes; anything else falls back to the
 * action's generic copy. The translator defaults to the English catalog so
 * unit tests and non-component callers stay deterministic.
 */
export function getAddToCartFailureCopy(
  kind: AddToCartFailureKind,
  options: { isBuyNow: boolean, t?: ErrorTranslator },
): ErrorCopy {
  const t = options.t ?? translateError;

  if (options.isBuyNow) {
    switch (kind) {
      case 'quantity_exceeds_stock':
      case 'out_of_stock':
        return {
          title: t('errors.cart.stockUnavailable.title'),
          description: t('errors.cart.stockUnavailable.description'),
        };
      case 'product_unavailable':
      case 'inventory_not_found':
        return {
          title: t('errors.cart.checkoutUnavailable.title'),
          description: t('errors.cart.checkoutUnavailable.description'),
        };
      default:
        return {
          title: t('errors.generic.title'),
          description: t('errors.generic.description'),
        };
    }
  }

  switch (kind) {
    case 'quantity_exceeds_stock':
    case 'out_of_stock':
      return {
        title: t('errors.cart.stockUnavailable.title'),
        description: t('errors.cart.stockUnavailable.description'),
      };
    case 'product_unavailable':
    case 'inventory_not_found':
      return {
        title: t('errors.cart.itemUnavailable.title'),
      };
    default:
      return {
        title: t('errors.generic.title'),
        description: t('errors.generic.description'),
      };
  }
}
