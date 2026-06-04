<script setup lang="ts">
import {
  APPROVED_ICON_PREFIXES,
  ICON_NAME_BY_ALIAS,
  resolveAppIconName,
} from './app-icon.constants'

defineOptions({
  inheritAttrs: false,
})

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

const resolvedName = computed<string>(() => {
  return resolveAppIconName(props.name) ?? ''
})

const ariaHidden = computed(() => {
  if (!props.decorative) {
    return undefined
  }

  return attrs['aria-label'] ? undefined : 'true'
})

const customizeByAlias = {
  shop: (content: string) => content.replaceAll(/stroke-width="[^"]*"/g, 'stroke-width="2"'),
} as const

const customizeIcon = computed(() => {
  return customizeByAlias[props.name as keyof typeof customizeByAlias]
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
    :customize="customizeIcon"
    v-bind="forwardedAttrs"
    :aria-hidden="ariaHidden"
    :class="[
      'inline-block shrink-0 align-middle',
      sizeClassByVariant[size],
      attrs.class,
    ]"
  />
</template>
