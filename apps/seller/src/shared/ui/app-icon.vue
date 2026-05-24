<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const ICON_NAME_BY_ALIAS = {
  search: 'i-uil:search',
  user: 'majesticons:user-line',
  cart: 'i-uil:cart',
  bell: 'i-heroicons-bell',
  settings: 'i-heroicons-cog-8-tooth',
  orders: 'i-heroicons-cube',
  account: 'majesticons:user-line',
  archive: 'i-heroicons-archive-box-20-solid',
  marketplace: 'solar:shop-bold-duotone',
  logout: 'i-heroicons-arrow-left-start-on-rectangle',
  manageShop: 'solar:shop-linear',
  warning: 'ph:warning-duotone',
  plus: 'i-heroicons-plus',
  minus: 'i-heroicons-minus',
  edit: 'lucide:edit',
  trash: 'i-heroicons-trash',
  close: 'i-material-symbols:cancel-rounded',
  check: 'i-material-symbols:check-circle-rounded',
  calendar: 'i-material-symbols:calendar-month-rounded',
  location: 'i-material-symbols:location-on-outline',
  arrowRight: 'i-heroicons-arrow-right',
  arrowLeft: 'i-material-symbols:arrow-back-ios-new-rounded',
  arrowForward: 'i-material-symbols:arrow-forward-ios',
  chevronRight: 'i-heroicons-chevron-right',
  chevronDown: 'i-heroicons-chevron-down-20-solid',
  language: 'i-heroicons-language',
  shop: 'solar:shop-linear',
  ticket: 'i-heroicons-ticket',
  camera: 'material-symbols:android-camera',
} as const

const APPROVED_ICON_PREFIXES = [
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

const props = withDefaults(defineProps<{
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  mode?: 'svg' | 'css'
  decorative?: boolean
}>(), {
  size: 'md',
  mode: 'svg',
  decorative: true,
})

const attrs = useAttrs()

const sizeClassByVariant = {
  xs: 'size-4',
  sm: 'size-5',
  md: 'size-5',
  lg: 'size-6',
  xl: 'size-7',
} as const

const forwardedAttrs = computed(() => {
  const { class: _class, ...restAttrs } = attrs
  return restAttrs
})

const resolvedName = computed(() => {
  return ICON_NAME_BY_ALIAS[props.name as keyof typeof ICON_NAME_BY_ALIAS] ?? props.name
})

const ariaHidden = computed(() => {
  if (!props.decorative) {
    return undefined
  }

  return attrs['aria-label'] ? undefined : 'true'
})

if (import.meta.dev) {
  watchEffect(() => {
    const isAlias = props.name in ICON_NAME_BY_ALIAS

    if (isAlias) {
      return
    }

    const isApprovedFamily = APPROVED_ICON_PREFIXES.some(prefix => resolvedName.value.startsWith(prefix))

    if (!isApprovedFamily) {
      console.warn(`[AppIcon] Unapproved icon family for "${props.name}". Add an alias or use an approved icon prefix.`)
    }
  })
}
</script>

<template>
  <Icon
    :name="resolvedName"
    :mode="mode"
    v-bind="forwardedAttrs"
    :aria-hidden="ariaHidden"
    :class="[
      'inline-block shrink-0 align-middle',
      sizeClassByVariant[size],
      attrs.class,
    ]"
  />
</template>
