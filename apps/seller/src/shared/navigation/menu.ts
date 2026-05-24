import type { RouteLocationRaw } from 'vue-router'
import { CreateCouponPageTypes } from '@arc/enums/shop'
import { routePaths, routes } from './routes'

export type AppNavigationItem = {
  label: string
  icon?: string
  to: RouteLocationRaw
  disabled?: boolean
}

export type AppSidebarLink = {
  title: string
  to?: RouteLocationRaw
  matchPath?: string
  disabled?: boolean
  sub?: AppSidebarLink[]
}

export const accountSidebarLinks: AppNavigationItem[] = [
  {
    label: 'Account',
    icon: 'i-heroicons-user',
    to: routes.account(),
  },
  {
    label: 'Shipping',
    icon: 'i-heroicons-map-pin',
    to: routes.accountAddresses(),
  },
  {
    label: 'Payment',
    disabled: true,
    icon: 'i-heroicons-credit-card',
    to: routes.home(),
  },
  {
    label: 'Privacy',
    disabled: true,
    icon: 'i-heroicons-shield-check',
    to: routes.home(),
  },
  {
    label: 'Preferences',
    disabled: true,
    icon: 'i-heroicons-cog',
    to: routes.home(),
  },
]

export const shopSidebarLinks: AppSidebarLink[] = [
  {
    title: 'Dashboard',
    to: routes.accountShopDashboard(),
    matchPath: routePaths.accountShopDashboard,
    disabled: true,
  },
  {
    title: 'Products',
    to: routes.accountShopProducts(),
    matchPath: routePaths.accountShopProducts,
  },
  {
    title: 'Messages',
    to: { path: '/messages' },
    matchPath: '/messages',
    disabled: true,
  },
  {
    title: 'Orders & Shipping',
    to: routes.accountShopOrders(),
    matchPath: routePaths.accountShopOrders,
  },
  {
    title: 'Marketing',
    sub: [
      {
        title: 'Ads',
        to: { path: '/ads' },
        matchPath: '/ads',
        disabled: true,
      },
      {
        title: 'Coupons',
        to: routes.accountShopCoupons(),
        matchPath: routePaths.accountShopCoupons,
      },
    ],
  },
  {
    title: 'Finances',
    to: { path: '/finances' },
    matchPath: '/finances',
    disabled: true,
  },
]

export const shopHeaderCreateLinks = [
  {
    label: 'Create Product',
    icon: 'i-heroicons-cube',
    shortcuts: ['P'],
    to: routes.accountShopProductsNew(),
  },
  {
    label: 'Create Coupon',
    icon: 'i-heroicons-ticket',
    shortcuts: ['C'],
    to: routes.accountShopCouponsNew(CreateCouponPageTypes.PROMO_CODE),
  },
  {
    label: 'Run Sale',
    icon: 'i-hugeicons:sale-tag-01',
    shortcuts: ['S'],
    to: routes.accountShopCouponsNew(CreateCouponPageTypes.SALE),
  },
] as const
