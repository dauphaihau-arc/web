import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router'
import type { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'
import {
  buildCategoryPath,
  buildOrderDetailPath,
  buildProductDetailPath,
  routePaths,
} from './route-paths'
import type { MyOrderListState } from '~/shared/api/me/order/contracts/order.contract'

export { routePaths } from './route-paths'

function createRoute(
  path: string,
  query?: LocationQueryRaw,
): RouteLocationRaw {
  if (!query) {
    return { path }
  }
  return { path, query }
}

export const routes = {
  home: () => createRoute(routePaths.home),
  reset: (query?: { v?: string | number }) => createRoute(routePaths.reset, query),
  account: () => createRoute(routePaths.account),
  accountNotifications: () => createRoute(routePaths.accountNotifications),
  accountAddresses: () => createRoute(routePaths.accountAddresses),
  orders: (query?: {
    search?: string
    shipping_status?: OrderShippingStatuses
    status?: OrderStatuses
    state?: MyOrderListState
  }) => createRoute(routePaths.orders, query),
  orderDetail: (id: string) => createRoute(buildOrderDetailPath(id)),
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
    guestZip?: string
    orderIds?: string
    sessionId?: string
  }) =>
    createRoute(routePaths.success, query
      ? {
          ...(query.guestEmail ? { guest_email: query.guestEmail } : {}),
          ...(query.guestZip ? { guest_zip: query.guestZip } : {}),
          ...(query.orderIds ? { order_ids: query.orderIds } : {}),
          ...(query.sessionId ? { session_id: query.sessionId } : {}),
        }
      : undefined),
  category: (categories: string | string[]) =>
    createRoute(buildCategoryPath(categories)),
  productDetail: (shopSlug: string, productSlug: string) =>
    createRoute(buildProductDetailPath(shopSlug, productSlug)),
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
