import type { LocationQueryRaw, RouteLocationRaw } from 'vue-router';
import type { CreateCouponPageTypes } from '~/shared/config/enums/shop';

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
  category: '/c',
  reset: '/reset',
  account: '/account',
  accountAddresses: '/account/addresses',
  accountShop: '/account/shop',
  accountShopDashboard: '/account/shop/dashboard',
  accountShopProducts: '/account/shop/products',
  accountShopCoupons: '/account/shop/coupons',
  orders: '/orders',
  search: '/search',
  cart: '/cart',
  cartCheckout: '/cart/checkout',
  checkout: '/checkout',
  success: '/success',
} as const;

export const routes = {
  home: () => createRoute(routePaths.home),
  reset: (query?: { v?: string | number }) => createRoute(routePaths.reset, query),
  account: () => createRoute(routePaths.account),
  accountAddresses: () => createRoute(routePaths.accountAddresses),
  accountShop: () => createRoute(routePaths.accountShop),
  accountShopDashboard: () => createRoute(routePaths.accountShopDashboard),
  accountShopProducts: () => createRoute(routePaths.accountShopProducts),
  accountShopProductsNew: () => createRoute(`${routePaths.accountShopProducts}/new`),
  accountShopProductDetail: (id: string) => createRoute(`${routePaths.accountShopProducts}/${id}`),
  accountShopCoupons: () => createRoute(routePaths.accountShopCoupons),
  accountShopCouponsNew: (type: CreateCouponPageTypes) =>
    createRoute(`${routePaths.accountShopCoupons}/new`, { type }),
  orders: () => createRoute(routePaths.orders),
  search: (query?: { search?: string }) => createRoute(routePaths.search, query),
  cart: () => createRoute(routePaths.cart),
  cartCheckout: () => createRoute(routePaths.cartCheckout),
  checkout: (query?: { c?: string }) => createRoute(routePaths.checkout, query),
  success: () => createRoute(routePaths.success),
  category: (categories: string | string[]) => {
    const slug = Array.isArray(categories) ? categories.join('/') : categories;
    return createRoute(`${routePaths.category}/${slug}`);
  },
  productDetail: (shopSlug: string, productSlug: string) =>
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
