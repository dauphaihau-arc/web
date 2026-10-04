import type { RouteLocationRaw } from 'vue-router';
import type { AppIconAlias } from '@arc/ui/foundation/app-icon.constants';
import type { LinkItem } from './sidebar.types';
import { routePaths, routes } from '~/shared/navigation/routes';

type ShopHeaderCreateItem = {
  label: string
  icon: AppIconAlias
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
        title: 'Sales',
        to: routes.sales(),
        matchPath: routePaths.sales,
      },
      {
        title: 'Promo codes',
        to: routes.promoCodes(),
        matchPath: routePaths.promoCodes,
      },
    ],
  },
  {
    title: 'Settings',
    icon: 'settings',
    matchPath: routePaths.settings,
    sub: [
      {
        title: 'General',
        icon: 'shop',
        to: routes.generalSettings(),
        matchPath: routePaths.generalSettings,
      },
      {
        title: 'Shipping Profiles',
        icon: 'shipping',
        to: routes.shippingSettings(),
        matchPath: routePaths.shippingSettings,
      },
    ],
  },
  {
    title: 'Finances',
    icon: 'revenue',
    to: { path: '/finances' },
    matchPath: '/finances',
    disabled: true,
  },
];

export const shopHeaderCreateItems: ShopHeaderCreateItem[] = [
  {
    label: 'Create Product',
    icon: 'product',
    shortcuts: ['c p'],
    sequence: ['c', 'p'],
    to: routes.productsNew(),
  },
  {
    label: 'Create promo code',
    icon: 'ticket',
    shortcuts: ['c c'],
    sequence: ['c', 'c'],
    to: routes.promoCodesNew(),
  },
  {
    label: 'Run Sale',
    icon: 'ticket',
    shortcuts: ['c s'],
    sequence: ['c', 's'],
    to: routes.salesNew(),
  },
];
