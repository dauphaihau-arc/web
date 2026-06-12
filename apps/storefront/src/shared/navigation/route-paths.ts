export const routePaths = {
  home: '/',
  category: '/c',
  reset: '/reset',
  account: '/account',
  accountNotifications: '/account/notifications',
  accountAddresses: '/account/addresses',
  accountMessages: '/account/messages',
  orders: '/orders',
  search: '/search',
  cart: '/cart',
  cartCheckout: '/cart/checkout',
  checkout: '/checkout',
  guestOrders: '/guest-orders',
  success: '/success',
} as const;

export function buildOrderDetailPath(id: string): string {
  return `${routePaths.orders}/${id}`;
}

export function buildCategoryPath(categories: string | string[]): string {
  const slug = Array.isArray(categories) ? categories.join('/') : categories;
  return `${routePaths.category}/${slug}`;
}

export function buildProductDetailPath(
  shopSlug: string,
  productSlug: string
): string {
  return `/${shopSlug}/${productSlug}`;
}
