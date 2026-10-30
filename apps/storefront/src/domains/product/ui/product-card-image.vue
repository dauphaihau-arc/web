<script setup lang="ts">
import type { CSSProperties } from 'vue'
import ProductImage from '@arc/ui/primitives/product-image.vue'

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

const frameClasses = computed(() => [
  props.stretch ? '' : 'w-fit shrink-0 self-start',
  props.frameClass,
].filter(Boolean).join(' '))

const imageClasses = computed(() => [
  props.hoverScale ? 'transition-transform duration-300 group-hover:scale-[1.03]' : '',
  props.imageClass,
].filter(Boolean).join(' '))
</script>

<template>
  <ProductImage
    :src="props.src"
    size="auto"
    rounded="lg"
    :frame-class="frameClasses"
    :frame-style="props.frameStyle"
    :image-class="imageClasses"
    :width="props.width"
    :height="props.height"
    :priority="props.priority"
  />
</template>
