import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router';

function createRoute(
  path: string,
  query?: LocationQueryRaw,
): RouteLocationRaw {
  if (!query) {
    return { path };
  }
  return { path, query };
}

export const routePaths = {
  root: '/',
  login: '/login',
  orders: '/orders',
  shops: '/shops',
  shopDetail: '/shops',
  users: '/users',
  usersNew: '/users/new',
  audit: '/audit',
} as const;

export const routes = {
  root: () => createRoute(routePaths.root),
  login: (query?: LocationQueryRaw) => createRoute(routePaths.login, query),
  orders: () => createRoute(routePaths.orders),
  orderDetail: (id: string) => createRoute(`${routePaths.orders}/${id}`),
  shops: () => createRoute(routePaths.shops),
  shopDetail: (shopId: string) => createRoute(`${routePaths.shopDetail}/${shopId}`),
  users: () => createRoute(routePaths.users),
  usersNew: () => createRoute(routePaths.usersNew),
  userDetail: (id: string) => createRoute(`${routePaths.users}/${id}`),
  audit: () => createRoute(routePaths.audit),
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

export function isRouteActive(
  currentPath: string,
  target: RouteLocationRaw,
  exact = false,
): boolean {
  const targetPath = getRoutePath(target);

  if (targetPath.length === 0) {
    return false;
  }

  return exact ? currentPath === targetPath : currentPath.startsWith(targetPath);
}
