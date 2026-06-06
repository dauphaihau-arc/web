<script setup lang="ts">
const props = withDefaults(defineProps<{
  containerClass?: string
}>(), {
  containerClass: 'grid min-h-[70vh] grid-cols-1 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)]',
})
</script>

<template>
  <AppPanel
    padding="none"
    rounded="dialog"
    :class="props.containerClass"
  >
    <slot />
  </AppPanel>
</template>
