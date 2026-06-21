export const ICON_NAME_BY_ALIAS = {
  ai: 'tabler:ai',
  search: 'i-uil:search',
  user: 'majesticons:user-line',
  cart: 'i-uil:cart',
  bell: 'akar-icons:bell',
  settings: 'i-heroicons-cog-8-tooth',
  orders: 'lets-icons:order',
  account: 'majesticons:user-line',
  archive: 'i-heroicons-archive-box-20-solid',
  marketplace: 'solar:shop-bold-duotone',
  logout: 'i-heroicons-arrow-left-start-on-rectangle',
  star: 'solar:star-bold',
  manageShop: 'solar:shop-linear',
  warning: 'ph:warning-duotone',
  plus: 'i-heroicons-plus',
  plusCircle: 'lucide:circle-plus',
  xCircle: 'lucide:circle-x',
  minus: 'i-heroicons-minus',
  edit: 'lucide:edit',
  trash: 'i-heroicons-trash',
  close: 'i-material-symbols:cancel-rounded',
  check: 'i-material-symbols:check-circle-rounded',
  calendar: 'i-material-symbols:calendar-month-rounded',
  location: 'i-material-symbols:location-on-outline',
  arrowRight: 'lucide:arrow-right',
  arrowLeft: 'lucide:arrow-left',
  arrowForward: 'tabler:arrow-forward',
  chevronLeft: 'lucide:chevron-left',
  chevronRight: 'lucide:chevron-right',
  chevronUp: 'i-heroicons-chevron-up-20-solid',
  chevronDown: 'i-heroicons-chevron-down-20-solid',
  language: 'i-heroicons-language',
  shop: 'mynaui:store',
  ticket: 'i-heroicons-ticket',
  camera: 'material-symbols:android-camera',
  message: 'tabler:message',
  shipping: 'lucide:plane',
  product: 'tabler:cube',
  dashboard: 'streamline-flex:dashboard-3',
  marketing: 'nimbus:marketing',
  refund: 'lets-icons:refund-forward',
  expired: 'i-heroicons-clock-20-solid',
  delivered: 'hugeicons:package-delivered',
  transit: 'lucide:map',
  payment: 'fluent:payment-28-regular',
  orderCreated: 'i-heroicons-document-plus-20-solid',
  moreHorizontal: 'i-heroicons-ellipsis-horizontal-20-solid',
} as const

export type AppIconAlias = keyof typeof ICON_NAME_BY_ALIAS

export const APPROVED_ICON_PREFIXES = [
  'i-heroicons-',
  'i-material-symbols:',
  'material-symbols:',
  'solar:',
  'i-solar:',
  'uil:',
  'i-uil:',
  'ph:',
  'majesticons:',
  'lucide:',
  'i-simple-icons:',
  'i-logos-',
] as const

export function resolveAppIconName(name?: AppIconAlias | string | null): string | undefined {
  if (!name) {
    return undefined
  }

  return ICON_NAME_BY_ALIAS[name as AppIconAlias] ?? name
}
