<script setup lang="ts">
const props = withDefaults(defineProps<{
  actionsClass?: string
}>(), {
  actionsClass: 'justify-end gap-2 px-4 pr-8 sm:px-8',
})
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-10 border-t bg-surface py-2.5">
    <div :class="['flex items-center', props.actionsClass]">
      <slot />
    </div>
  </div>
</template>
