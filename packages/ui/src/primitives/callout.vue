<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { ICON_NAME_BY_ALIAS } from '../foundation/app-icon.constants'
import AppIcon from './app-icon.vue'

defineOptions({
  inheritAttrs: false,
})

type CalloutColor = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

const props = withDefaults(defineProps<{
  to?: RouteLocationRaw
  target?: string
  icon?: string
  color?: CalloutColor
}>(), {
  to: undefined,
  target: undefined,
  icon: undefined,
  color: 'neutral',
})

const attrs = useAttrs()

const colorClassByVariant = {
  neutral: 'border-border-subtle bg-surface-muted text-text-subtle',
  info: 'border-state-info-border bg-state-info-surface text-state-info-text',
  success: 'border-state-success-border bg-state-success-surface text-state-success-text',
  warning: 'border-state-warning-border bg-state-warning-surface text-state-warning-text',
  danger: 'border-state-danger-border bg-state-danger-surface text-state-danger-text',
} as const satisfies Record<CalloutColor, string>

const forwardedAttrs = computed(() => {
  const { class: _class, ...restAttrs } = attrs
  return restAttrs
})

const isExternalLink = computed(() =>
  typeof props.to === 'string' && /^https?:\/\//.test(props.to),
)

const resolvedTarget = computed(() => props.target ?? (isExternalLink.value ? '_blank' : undefined))
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    :class="[
      'relative block rounded-md border px-4 py-3 text-sm leading-6',
      colorClassByVariant[props.color],
      props.to && 'border-dashed',
      attrs.class,
    ]"
  >
    <NuxtLink
      v-if="props.to"
      :to="props.to"
      :target="resolvedTarget"
      class="focus:outline-none"
    >
      <span
        class="absolute inset-0"
        aria-hidden="true"
      />
    </NuxtLink>

    <AppIcon
      v-if="props.icon"
      :name="props.icon"
      size="xs"
      class="me-2 inline-block align-sub"
    />

    <AppIcon
      v-if="resolvedTarget === '_blank'"
      :name="ICON_NAME_BY_ALIAS.externalLink"
      size="xs"
      class="pointer-events-none absolute end-2 top-2"
    />

    <slot />
  </div>
</template>
