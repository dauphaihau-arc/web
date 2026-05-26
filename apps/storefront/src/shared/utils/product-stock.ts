export const PRODUCT_STOCK_NOTICE_THRESHOLD = 10

export function getProductStockNotice(
  stock: number,
  options?: {
    backInStock?: boolean
  },
): string {
  if (options?.backInStock && stock > 0) {
    return 'Back in stock'
  }

  if (stock <= 0) {
    return 'Out of stock'
  }

  if (stock < PRODUCT_STOCK_NOTICE_THRESHOLD) {
    return `Low in stock, only ${stock} left`
  }

  return ''
}
