import type { RouteLocationRaw } from 'vue-router';
import { CreateCouponPageTypes } from '@arc/enums/shop';
import type { LinkItem } from './sidebar.types';
import { routePaths, routes } from '~/shared/navigation/routes';

type ShopHeaderCreateItem = {
  label: string
  icon: string
  shortcuts: string[]
  sequence: [string, string]
  to: RouteLocationRaw
};

export const shopSidebarItems: LinkItem[] = [
  {
    title: 'Dashboard',
    icon: 'dashboard',
    to: routes.dashboard(),
    matchPath: routePaths.dashboard,
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

export const shopHeaderCreateItems: ShopHeaderCreateItem[] = [
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
];
