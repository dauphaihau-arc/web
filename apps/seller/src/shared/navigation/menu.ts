import type { RouteLocationRaw } from 'vue-router';
import { CreateCouponPageTypes } from '@arc/enums/shop';
import { routePaths, routes } from './routes';

export type AppNavigationItem = {
  label: string
  icon?: string
  to: RouteLocationRaw
  disabled?: boolean
};

export type AppSidebarLink = {
  title: string
  icon?: string
  to?: RouteLocationRaw
  matchPath?: string
  disabled?: boolean
  sub?: AppSidebarLink[]
};

export const shopSidebarLinks: AppSidebarLink[] = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    to: routes.dashboard(),
    matchPath: routePaths.dashboard,
    disabled: true,
  },
  {
    title: 'Products',
    icon: 'product',
    to: routes.products(),
    matchPath: routePaths.products,
  },
  {
    title: 'Messages',
    icon: 'message',
    to: routes.messages(),
    matchPath: '/messages',
  },
  {
    title: 'Orders',
    icon: 'orders',
    to: routes.orders(),
    matchPath: routePaths.orders,
  },
  {
    title: 'Marketing',
    icon: 'marketing',
    sub: [
      // {
      //   title: 'Ads',
      //   icon: 'i-heroicons-megaphone',
      //   to: { path: '/ads' },
      //   matchPath: '/ads',
      //   disabled: true,
      // },
      {
        title: 'Coupons',
        icon: 'i-heroicons-ticket',
        to: routes.coupons(),
        matchPath: routePaths.coupons,
      },
    ],
  },
  {
    title: 'Finances',
    icon: 'i-heroicons-banknotes',
    to: { path: '/finances' },
    matchPath: '/finances',
    disabled: true,
  },
];

export const shopHeaderCreateLinks = [
  {
    label: 'Create Product',
    icon: 'i-heroicons-cube',
    shortcuts: ['c p'],
    sequence: ['c', 'p'],
    to: routes.productsNew(),
  },
  {
    label: 'Create Coupon',
    icon: 'i-heroicons-ticket',
    shortcuts: ['c c'],
    sequence: ['c', 'c'],
    to: routes.couponsNew(CreateCouponPageTypes.PROMO_CODE),
  },
  // {
  //   label: 'Run Sale',
  //   icon: 'i-hugeicons:sale-tag-01',
  //   shortcuts: ['S'],
  //   to: routes.couponsNew(CreateCouponPageTypes.SALE),
  // },
] as const;
