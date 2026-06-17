import type { RouteLocationRaw } from 'vue-router'
import type { AppIconAlias } from '@arc/ui/foundation/app-icon.constants'
import { routes } from './routes'

export type AppNavigationItem = {
  label: string
  icon?: AppIconAlias | string
  to: RouteLocationRaw
  disabled?: boolean
}

export const accountSidebarLinks: AppNavigationItem[] = [
  {
    label: 'Account',
    icon: 'account',
    to: routes.account(),
  },
  {
    label: 'Messages',
    icon: 'message',
    to: routes.accountMessages(),
  },
  {
    label: 'Addresses',
    icon: 'location',
    to: routes.accountAddresses(),
  },
  // {
  //   label: 'Summary',
  //   disabled: true,
  //   icon: 'i-heroicons-credit-card',
  //   to: routes.home(),
  // },
  // {
  //   label: 'Privacy',
  //   disabled: true,
  //   icon: 'i-heroicons-shield-check',
  //   to: routes.home(),
  // },
  // {
  //   label: 'Preferences',
  //   disabled: true,
  //   icon: 'i-heroicons-cog',
  //   to: routes.home(),
  // },
]
