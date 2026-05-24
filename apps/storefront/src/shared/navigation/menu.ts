import type { RouteLocationRaw } from 'vue-router'
import { routes } from './routes'

export type AppNavigationItem = {
  label: string
  icon?: string
  to: RouteLocationRaw
  disabled?: boolean
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
