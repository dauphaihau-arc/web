export function getProductStockNotice(
  stock: number,
  options?: {
    backInStock?: boolean
    lowStockThreshold?: number
  }
): string {
  if (options?.backInStock && stock > 0) {
    return 'Back in stock';
  }

  if (stock <= 0) {
    return 'Out of stock';
  }

  if (options?.lowStockThreshold != null && stock < options.lowStockThreshold) {
    return `Low in stock, only ${stock} left`;
  }

  return '';
}
