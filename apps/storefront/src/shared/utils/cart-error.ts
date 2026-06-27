import { getBackendErrorCode, getBackendErrorMessage } from '~/shared/utils/backend-error'

export type AddToCartFailureKind =
  | 'out_of_stock'
  | 'quantity_exceeds_stock'
  | 'product_unavailable'
  | 'inventory_not_found'
  | 'unknown'

export function resolveAddToCartFailure(error: unknown): AddToCartFailureKind {
  const backendCode = getBackendErrorCode(error)

  switch (backendCode) {
    case 'CART_QUANTITY_EXCEEDS_STOCK':
      return 'quantity_exceeds_stock'
    case 'PRODUCT_UNAVAILABLE_FOR_CART':
      return 'product_unavailable'
    case 'PRODUCT_INVENTORY_NOT_FOUND':
      return 'inventory_not_found'
  }

  const backendMessage = getBackendErrorMessage(error)?.toLowerCase() ?? ''

  if (backendMessage.includes('quantity of product exceeds stock')) {
    return 'quantity_exceeds_stock'
  }
  if (backendMessage.includes('product is not available for cart operations')) {
    return 'product_unavailable'
  }
  if (backendMessage.includes('inventory') && backendMessage.includes('was not found')) {
    return 'inventory_not_found'
  }
  if (backendMessage.includes('out of stock')) {
    return 'out_of_stock'
  }

  return 'unknown'
}

export function getAddToCartFailureCopy(
  kind: AddToCartFailureKind,
  options: { isBuyNow: boolean },
): {
    title: string
    description?: string
  } {
  if (options.isBuyNow) {
    switch (kind) {
      case 'quantity_exceeds_stock':
      case 'out_of_stock':
        return {
          title: 'Stock no longer available',
          description: 'The requested quantity is no longer available. Update your selection and try again.',
        }
      case 'product_unavailable':
      case 'inventory_not_found':
        return {
          title: 'Unable to start checkout',
          description: 'This item is no longer available for immediate checkout.',
        }
      default:
        return {
          title: 'Unable to start checkout',
        }
    }
  }

  switch (kind) {
    case 'quantity_exceeds_stock':
    case 'out_of_stock':
      return {
        title: 'Stock no longer available',
        description: 'The requested quantity is no longer available. Update your selection and try again.',
      }
    case 'product_unavailable':
    case 'inventory_not_found':
      return {
        title: 'This item is no longer available',
      }
    default:
      return {
        title: 'Add product to cart failed',
      }
  }
}
