<script setup lang="ts">
import type { CSSProperties } from 'vue'

import AppIcon from './app-icon.vue'

const props = withDefaults(defineProps<{
  src?: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'auto'
  width?: number
  height?: number
  rounded?: 'none' | 'md' | 'lg' | 'xl' | 'full'
  fit?: 'cover' | 'contain'
  priority?: boolean
  frameClass?: string
  frameStyle?: CSSProperties
  imageClass?: string
}>(), {
  alt: '',
  size: 'md',
  rounded: 'lg',
  fit: 'cover',
  priority: false,
  frameClass: '',
  imageClass: '',
})

const sizeClassByVariant = {
  xs: 'size-8',
  sm: 'size-12',
  md: 'size-16',
  lg: 'size-[72px]',
  xl: 'size-24',
  '2xl': 'size-[180px]',
  auto: '',
} as const

const intrinsicSizeByVariant = {
  xs: 32,
  sm: 48,
  md: 64,
  lg: 72,
  xl: 96,
  '2xl': 180,
  auto: 600,
} as const

const iconSizeByVariant = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
  auto: 'lg',
} as const

const roundedClassByVariant = {
  none: 'rounded-none',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const

const fitClassByVariant = {
  cover: 'object-cover',
  contain: 'object-contain',
} as const

const failed = ref(false)

const resolvedWidth = computed(() => props.width ?? intrinsicSizeByVariant[props.size])
const resolvedHeight = computed(() => props.height ?? intrinsicSizeByVariant[props.size])

// A recycled row can swap `src` under the same instance: drop the stale failure so the
// new image gets a chance to load instead of keeping the placeholder forever.
watch(() => props.src, () => {
  failed.value = false
})
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden bg-media-product ring-1 ring-border-subtle',
      sizeClassByVariant[size],
      roundedClassByVariant[rounded],
      frameClass,
    ]"
    :style="frameStyle"
  >
    <AppIcon
      v-if="!src || failed"
      name="image"
      :size="iconSizeByVariant[size]"
      class="absolute inset-0 m-auto text-text-muted"
    />
    <NuxtImg
      v-else
      :src="src"
      :alt="alt"
      densities="1"
      :width="resolvedWidth"
      :height="resolvedHeight"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      :class="[
        'absolute inset-0 size-full',
        fitClassByVariant[fit],
        imageClass,
      ]"
      @error="failed = true"
    />
  </div>
</template>
