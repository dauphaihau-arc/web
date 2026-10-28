<script setup lang="ts">
const props = withDefaults(defineProps<{
  align?: 'start' | 'end' | 'between'
  fullWidth?: boolean
}>(), {
  align: 'end',
  fullWidth: false,
})

const alignmentClass = computed(() => {
  switch (props.align) {
    case 'start':
      return 'justify-start'
    case 'between':
      return 'justify-between'
    default:
      return 'justify-end'
  }
})
</script>

<template>
  <div :class="['flex items-center gap-3', alignmentClass, props.fullWidth && 'w-full']">
    <slot />
  </div>
</template>
