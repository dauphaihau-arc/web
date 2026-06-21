import type { ResponseGetOrderShopsProduct } from '~/shared/api/me/order/contracts/order.contract'

export const MAX_REVIEW_IMAGES = 5
export const MAX_REVIEW_IMAGE_BYTES = 8 * 1024 * 1024

export function buildProductLabel(product: ResponseGetOrderShopsProduct) {
  const variant = product.inventory.variant?.trim()

  if (!variant) {
    return product.title
  }

  return `${product.title} (${variant})`
}

export function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
}
