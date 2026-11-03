<script setup lang="ts">
defineProps<{
  label: string
  description?: string
}>()
</script>

<template>
  <div
    class="grid gap-2 py-5 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8"
  >
    <div class="space-y-1">
      <p class="text-sm font-medium text-text-strong">
        {{ label }}
      </p>
      <p
        v-if="description"
        class="text-sm text-text-subtle"
      >
        {{ description }}
      </p>
    </div>

    <div class="min-w-0">
      <slot />
    </div>
  </div>
</template>
