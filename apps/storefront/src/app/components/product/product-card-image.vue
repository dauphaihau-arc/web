<script setup lang="ts">
import type { CSSProperties } from 'vue'

const props = withDefaults(defineProps<{
  src?: string
  frameClass?: string
  frameStyle?: CSSProperties
  imageClass?: string
  hoverScale?: boolean
  stretch?: boolean
}>(), {
  src: undefined,
  frameClass: '',
  frameStyle: undefined,
  imageClass: '',
  hoverScale: false,
  stretch: true,
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
      :class="[
        'absolute inset-0 block size-full object-cover object-center',
        props.hoverScale ? 'transition-transform duration-300 group-hover:scale-[1.03]' : '',
        props.imageClass,
      ]"
    />
  </div>
</template>
