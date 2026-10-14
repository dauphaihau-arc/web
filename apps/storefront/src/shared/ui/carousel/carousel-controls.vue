<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'

const props = withDefaults(defineProps<{
  canPrev?: boolean
  canNext?: boolean
}>(), {
  canPrev: false,
  canNext: false,
})

const emit = defineEmits<{
  prev: []
  next: []
}>()

const buttonClass = 'pointer-events-auto absolute top-1/2 z-10 hidden rounded-full bg-white text-text shadow-sm ring-1 ring-black/5 transition-all hover:bg-white hover:text-text hover:shadow-md active:scale-95 md:flex'
</script>

<template>
  <!-- The layer mirrors the track gutter, so the chevrons stay put on the row's
       outer edges — half over the gutter, on the first and last visible slide —
       however far the track is scrolled. -->
  <div class="pointer-events-none absolute inset-x-4 inset-y-0 md:inset-x-12 lg:inset-x-16">
    <UButton
      v-if="props.canPrev"
      variant="ghost"
      :icon="ICON_NAME_BY_ALIAS['chevronLeftSolid']"
      :class="[buttonClass, 'left-0 -translate-x-1/2 -translate-y-1/2']"
      aria-label="Previous"
      @click="emit('prev')"
    />
    <UButton
      v-if="props.canNext"
      variant="ghost"
      :icon="ICON_NAME_BY_ALIAS['chevronRightSolid']"
      :class="[buttonClass, 'right-0 -translate-y-1/2 translate-x-1/2']"
      aria-label="Next"
      @click="emit('next')"
    />
  </div>
</template>
