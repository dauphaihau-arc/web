import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router'
import type { CreateCouponPageTypes } from '@arc/enums/shop'

function createRoute(
  path: string,
  query?: LocationQueryRaw,
): RouteLocationRaw {
  if (!query) {
    return { path }
  }
  return { path, query }
}

export const routePaths = {
  home: '/',
  login: '/login',
  category: '/c',
  reset: '/reset',
  account: '/',
  accountAddresses: '/',
  accountShop: '/',
  accountShopDashboard: '/dashboard',
  accountShopProducts: '/products',
  accountShopCoupons: '/coupons',
  accountShopOrders: '/orders',
  orders: '/orders',
  orderDetail: '/orders',
  search: '/search',
  cart: '/cart',
  cartCheckout: '/cart/checkout',
  checkout: '/checkout',
  guestOrders: '/guest-orders',
  success: '/success',
} as const

export const routes = {
  home: () => createRoute(routePaths.home),
  login: () => createRoute(routePaths.login),
  reset: (query?: { v?: string | number }) => createRoute(routePaths.reset, query),
  account: () => createRoute(routePaths.account),
  accountAddresses: () => createRoute(routePaths.accountAddresses),
  accountShop: () => createRoute(routePaths.accountShop),
  accountShopDashboard: () => createRoute(routePaths.accountShopDashboard),
  accountShopProducts: () => createRoute(routePaths.accountShopProducts),
  accountShopProductsNew: () => createRoute(`${routePaths.accountShopProducts}/new`),
  accountShopProductDetail: (id: string) => createRoute(`${routePaths.accountShopProducts}/${id}`),
  accountShopCoupons: () => createRoute(routePaths.accountShopCoupons),
  accountShopOrders: () => createRoute(routePaths.accountShopOrders),
  accountShopOrderDetail: (id: string) => createRoute(`${routePaths.accountShopOrders}/${id}`),
  accountShopCouponsNew: (type: CreateCouponPageTypes) =>
    createRoute(`${routePaths.accountShopCoupons}/new`, { type }),
  orders: () => createRoute(routePaths.orders),
  orderDetail: (id: string) => createRoute(`${routePaths.orderDetail}/${id}`),
  search: (query?: { search?: string }) => createRoute(routePaths.search, query),
  cart: () => createRoute(routePaths.cart),
  cartCheckout: () => createRoute(routePaths.cartCheckout),
  checkout: (query?: { c?: string }) => createRoute(routePaths.checkout, query),
  guestOrders: (query?: {
    email?: string
    orderId?: string
    orderIds?: string
    sessionId?: string
    token?: string
    zip?: string
  }) =>
    createRoute(routePaths.guestOrders, query
      ? {
          ...(query.email ? { email: query.email } : {}),
          ...(query.orderId ? { order_id: query.orderId } : {}),
          ...(query.orderIds ? { order_ids: query.orderIds } : {}),
          ...(query.sessionId ? { session_id: query.sessionId } : {}),
          ...(query.token ? { token: query.token } : {}),
          ...(query.zip ? { zip: query.zip } : {}),
        }
      : undefined),
  success: (query?: {
    guestEmail?: string
    orderIds?: string
    sessionId?: string
  }) =>
    createRoute(routePaths.success, query
      ? {
          ...(query.guestEmail ? { guest_email: query.guestEmail } : {}),
          ...(query.orderIds ? { order_ids: query.orderIds } : {}),
          ...(query.sessionId ? { session_id: query.sessionId } : {}),
        }
      : undefined),
  category: (categories: string | string[]) => {
    const slug = Array.isArray(categories) ? categories.join('/') : categories
    return createRoute(`${routePaths.category}/${slug}`)
  },
  productDetail: (shopSlug: string, productSlug: string) =>
    createRoute(`/${shopSlug}/${productSlug}`),
} as const

export function getRoutePath(to: RouteLocationRaw): string {
  if (typeof to === 'string') {
    return to
  }

  if ('path' in to && typeof to.path === 'string') {
    return to.path
  }

  return ''
}

export function isRouteActive(currentPath: string, target: RouteLocationRaw): boolean {
  const targetPath = getRoutePath(target)

  return targetPath.length > 0 && currentPath.startsWith(targetPath)
}
