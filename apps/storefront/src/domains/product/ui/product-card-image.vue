<script setup lang="ts">
import type { CSSProperties } from 'vue'

// `card_1x1` storage variant box: 600x600, `fit: cover`.
const CARD_VARIANT_WIDTH = 600
const CARD_VARIANT_HEIGHT = 600

const props = withDefaults(defineProps<{
  src?: string
  frameClass?: string
  frameStyle?: CSSProperties
  imageClass?: string
  hoverScale?: boolean
  stretch?: boolean
  width?: number
  height?: number
  /** Above-the-fold card holding the LCP candidate: eager, top fetch priority. */
  priority?: boolean
}>(), {
  src: undefined,
  frameClass: '',
  frameStyle: undefined,
  imageClass: '',
  hoverScale: false,
  stretch: true,
  width: CARD_VARIANT_WIDTH,
  height: CARD_VARIANT_HEIGHT,
  priority: false,
})
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-lg bg-media-product ring-1 ring-border-subtle',
      props.stretch ? '' : 'w-fit shrink-0 self-start',
      props.frameClass,
    ]"
    :style="props.frameStyle"
  >
    <NuxtImg
      v-if="props.src"
      :src="props.src"
      densities="1"
      :width="props.width"
      :height="props.height"
      :loading="props.priority ? 'eager' : 'lazy'"
      :fetchpriority="props.priority ? 'high' : undefined"
      :class="[
        'absolute inset-0 block size-full object-cover object-center',
        props.hoverScale ? 'transition-transform duration-300 group-hover:scale-[1.03]' : '',
        props.imageClass,
      ]"
    />
  </div>
</template>
