<script setup lang="ts">
import AppIcon from './app-icon.vue'

defineOptions({
  inheritAttrs: false,
})

type StatusBadgeColor = 'green' | 'gray' | 'yellow' | 'red' | 'blue'
type StatusBadgeSize = 'sm' | 'md'

const props = withDefaults(defineProps<{
  label?: string
  color?: StatusBadgeColor
  size?: StatusBadgeSize
  icon?: string
  trailingIcon?: string
}>(), {
  label: '',
  color: 'gray',
  size: 'sm',
  icon: undefined,
  trailingIcon: undefined,
})

const attrs = useAttrs()
const slots = useSlots()

const colorClassByVariant = {
  green: 'border-state-success-border bg-state-success-surface text-state-success-text',
  gray: 'border-state-neutral-border bg-state-neutral-surface text-state-neutral-text',
  yellow: 'border-state-warning-border bg-state-warning-surface text-state-warning-text',
  red: 'border-state-danger-border bg-state-danger-surface text-state-danger-text',
  blue: 'border-state-info-border bg-state-info-surface text-state-info-text',
} as const satisfies Record<StatusBadgeColor, string>

const sizeClassByVariant = {
  sm: {
    badge: 'min-h-6 gap-1.5 px-2.5 text-xs',
    icon: 'size-3.5',
  },
  md: {
    badge: 'min-h-8 gap-2 px-3.5 text-sm',
    icon: 'size-4',
  },
} as const satisfies Record<StatusBadgeSize, { badge: string, icon: string }>

const forwardedAttrs = computed(() => {
  const { class: _class, ...restAttrs } = attrs
  return restAttrs
})
</script>

<template>
  <span
    v-bind="forwardedAttrs"
    :class="[
      'inline-flex items-center rounded-md border font-medium leading-none',
      colorClassByVariant[props.color],
      sizeClassByVariant[props.size].badge,
      attrs.class,
    ]"
  >
    <AppIcon
      v-if="props.icon"
      :name="props.icon"
      :class="sizeClassByVariant[props.size].icon"
    />

    <slot>
      {{ props.label }}
    </slot>

    <AppIcon
      v-if="props.trailingIcon"
      :name="props.trailingIcon"
      :class="sizeClassByVariant[props.size].icon"
    />

    <slot
      v-else-if="slots.trailing"
      name="trailing"
    />
  </span>
</template>
