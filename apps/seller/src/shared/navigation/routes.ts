import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router';
import type { CreateCouponPageTypes } from '@arc/enums/shop';

function createRoute(
  path: string,
  query?: LocationQueryRaw
): RouteLocationRaw {
  if (!query) {
    return { path };
  }
  return { path, query };
}

export const routePaths = {
  home: '/',
  login: '/login',
  register: '/register',
  sell: '/sell',
  reset: '/reset',
  dashboard: '/dashboard',
  products: '/products',
  coupons: '/coupons',
  orders: '/orders',
  messages: '/messages',
  notifications: '/notifications',
} as const;

export const routes = {
  home: () => createRoute(routePaths.home),
  login: () => createRoute(routePaths.login),
  register: () => createRoute(routePaths.register),
  sell: () => createRoute(routePaths.sell),
  reset: (query?: { v?: string | number }) => createRoute(routePaths.reset, query),
  dashboard: () => createRoute(routePaths.dashboard),
  products: () => createRoute(routePaths.products),
  productsNew: () => createRoute(`${routePaths.products}/new`),
  productDetail: (id: string) => createRoute(`${routePaths.products}/${id}`),
  coupons: () => createRoute(routePaths.coupons),
  orders: () => createRoute(routePaths.orders),
  messages: (query?: { conversationId?: string }) =>
    createRoute(
      routePaths.messages,
      query?.conversationId ? { conversation_id: query.conversationId } : undefined
    ),
  notifications: () => createRoute(routePaths.notifications),
  orderDetail: (id: string) => createRoute(`${routePaths.orders}/${id}`),
  couponsNew: (type: CreateCouponPageTypes) =>
    createRoute(`${routePaths.coupons}/new`, { type }),
  storefrontProductDetail: (shopSlug: string, productSlug: string) =>
    createRoute(`/${shopSlug}/${productSlug}`),
} as const;

export function getRoutePath(to: RouteLocationRaw): string {
  if (typeof to === 'string') {
    return to;
  }

  if ('path' in to && typeof to.path === 'string') {
    return to.path;
  }

  return '';
}

export function isRouteActive(currentPath: string, target: RouteLocationRaw): boolean {
  const targetPath = getRoutePath(target);

  return targetPath.length > 0 && currentPath.startsWith(targetPath);
}
