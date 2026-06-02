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

export const shopSidebarLinks: AppSidebarLink[] = [
  {
    title: 'Dashboard',
    to: routes.dashboard(),
    matchPath: routePaths.dashboard,
    disabled: true,
  },
  {
    title: 'Products',
    to: routes.products(),
    matchPath: routePaths.products,
  },
  {
    title: 'Messages',
    to: { path: '/messages' },
    matchPath: '/messages',
    disabled: true,
  },
  {
    title: 'Orders',
    to: routes.orders(),
    matchPath: routePaths.orders,
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
        to: routes.coupons(),
        matchPath: routePaths.coupons,
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
    to: routes.productsNew(),
  },
  {
    label: 'Create Coupon',
    icon: 'i-heroicons-ticket',
    shortcuts: ['C'],
    to: routes.couponsNew(CreateCouponPageTypes.PROMO_CODE),
  },
  {
    label: 'Run Sale',
    icon: 'i-hugeicons:sale-tag-01',
    shortcuts: ['S'],
    to: routes.couponsNew(CreateCouponPageTypes.SALE),
  },
] as const
