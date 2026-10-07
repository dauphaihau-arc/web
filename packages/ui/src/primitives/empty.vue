<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { ICON_NAME_BY_ALIAS } from '../foundation/app-icon.constants'
import AppIcon from './app-icon.vue'

defineOptions({
  inheritAttrs: false,
})

type EmptyVariant = 'outline' | 'soft' | 'subtle' | 'naked'
type EmptySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
/** `UButton` stops at `xl`, so action sizes stay inside that range. */
type EmptyActionSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type EmptyAvatar = {
  src?: string | boolean
  alt?: string
  text?: string
  icon?: string
  size?: EmptySize
}

type EmptyActionColor
  = | 'white'
    | 'gray'
    | 'black'
    | 'red'
    | 'orange'
    | 'yellow'
    | 'green'
    | 'teal'
    | 'blue'
    | 'indigo'
    | 'purple'
    | 'pink'

type EmptyActionVariant = 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost' | 'link'

type EmptyAction = {
  label?: string
  icon?: string
  trailingIcon?: string
  color?: EmptyActionColor
  variant?: EmptyActionVariant
  size?: EmptyActionSize
  to?: RouteLocationRaw
  target?: string
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<{
  as?: string
  icon?: string
  avatar?: EmptyAvatar
  loading?: boolean
  loadingIcon?: string
  title?: string
  description?: string
  actions?: EmptyAction[]
  variant?: EmptyVariant
  size?: EmptySize
  containerClass?: string
  headingClass?: string
  actionsClass?: string
}>(), {
  as: 'div',
  icon: undefined,
  avatar: undefined,
  loading: false,
  loadingIcon: ICON_NAME_BY_ALIAS.loading,
  title: undefined,
  description: undefined,
  actions: () => [],
  variant: 'outline',
  size: 'md',
  containerClass: '',
  headingClass: '',
  actionsClass: '',
})

const attrs = useAttrs()
const slots = useSlots()

const rootClassByVariant = {
  outline: 'border border-border-subtle bg-surface',
  soft: 'bg-surface-muted',
  subtle: 'border border-border-subtle bg-surface-muted',
  naked: '',
} as const satisfies Record<EmptyVariant, string>

const sizeClassByVariant = {
  xs: { icon: 'xs', title: 'text-sm', description: 'text-xs' },
  sm: { icon: 'sm', title: 'text-sm', description: 'text-xs' },
  md: { icon: 'md', title: 'text-base', description: 'text-sm' },
  lg: { icon: 'lg', title: 'text-base', description: 'text-sm' },
  xl: { icon: 'xl', title: 'text-lg', description: 'text-base' },
  '2xl': { icon: '2xl', title: 'text-xl', description: 'text-base' },
  '3xl': { icon: '3xl', title: 'text-2xl', description: 'text-lg' },
} as const satisfies Record<EmptySize, { icon: EmptySize, title: string, description: string }>

const actionSizeByVariant = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  '2xl': 'xl',
  '3xl': 'xl',
} as const satisfies Record<EmptySize, EmptyActionSize>

const resolvedIcon = computed(() => props.loading ? props.loadingIcon : props.icon)

const resolvedAvatarIcon = computed(() => props.avatar?.icon ?? resolvedIcon.value)
const resolvedAvatarSize = computed(() => props.avatar?.size ?? props.size)

const hasHeader = computed(() =>
  !!slots.header
  || !!slots.leading
  || !!resolvedIcon.value
  || !!props.avatar
  || !!props.title
  || !!slots.title
  || !!props.description
  || !!slots.description,
)

const hasActions = computed(() => props.actions.length > 0 || !!slots.actions)
</script>

<template>
  <component
    :is="props.as"
    v-bind="attrs"
    data-slot="root"
    :aria-busy="props.loading ? 'true' : undefined"
    :class="[
      'relative flex min-w-0 flex-col items-center justify-center gap-4 rounded-panel p-4 sm:p-6 lg:p-8',
      rootClassByVariant[props.variant],
      props.containerClass,
      attrs.class,
    ]"
  >
    <div
      v-if="hasHeader"
      data-slot="header"
      class="flex max-w-sm flex-col items-center gap-2 text-center"
    >
      <slot name="header">
        <slot name="leading">
          <UAvatar
            v-if="props.avatar"
            v-bind="props.avatar"
            :icon="resolvedAvatarIcon"
            :size="resolvedAvatarSize"
            class="shrink-0"
          />

          <AppIcon
            v-else-if="resolvedIcon"
            :name="resolvedIcon"
            :size="sizeClassByVariant[props.size].icon"
            :class="props.loading && 'animate-spin'"
          />
        </slot>

        <h2
          v-if="props.title || slots.title"
          data-slot="title"
          :class="[
            'font-medium text-pretty text-text-strong',
            sizeClassByVariant[props.size].title,
            props.headingClass,
          ]"
        >
          <slot name="title">
            {{ props.title }}
          </slot>
        </h2>

        <p
          v-if="props.description || slots.description"
          data-slot="description"
          :class="[
            'text-balance text-center text-text-muted',
            sizeClassByVariant[props.size].description,
          ]"
        >
          <slot name="description">
            {{ props.description }}
          </slot>
        </p>
      </slot>
    </div>

    <div
      v-if="slots.body || hasActions"
      data-slot="body"
      class="flex max-w-sm flex-col items-center gap-4"
    >
      <slot name="body">
        <div
          v-if="hasActions"
          data-slot="actions"
          :class="['flex shrink-0 flex-wrap justify-center gap-2', props.actionsClass]"
        >
          <slot name="actions">
            <UButton
              v-for="(action, index) in props.actions"
              :key="index"
              :size="actionSizeByVariant[props.size]"
              v-bind="action"
            />
          </slot>
        </div>
      </slot>
    </div>

    <div
      v-if="slots.footer"
      data-slot="footer"
      class="flex max-w-sm flex-col items-center gap-2"
    >
      <slot name="footer" />
    </div>
  </component>
</template>
