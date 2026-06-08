<script lang="ts" setup>
defineProps<{
  label: string
}>()
</script>

<template>
  <div class="space-y-1">
    <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
      {{ label }}
    </div>
    <div class="text-text-muted">
      <slot />
    </div>
  </div>
</template>
