<script setup lang="ts">
const props = withDefaults(defineProps<{
  state?: 'default' | 'danger'
  align?: 'center' | 'left'
  shadow?: 'none' | 'sm'
}>(), {
  state: 'default',
  align: 'center',
  shadow: 'none',
})

const toneClass = computed(() => props.state === 'danger'
  ? 'text-state-danger-text'
  : 'text-text-muted')

const alignClass = computed(() => props.align === 'left' ? 'text-left' : 'text-center')
</script>

<template>
  <AppPanel
    padding="lg"
    :tone="props.state === 'danger' ? 'danger' : 'default'"
    :shadow="shadow"
    :class="['text-sm', alignClass, toneClass]"
  >
    <slot />
  </AppPanel>
</template>
