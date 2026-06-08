<script lang="ts" setup>
defineProps<{
  title: string
}>()
</script>

<template>
  <UCard>
    <div class="font-semibold">
      {{ title }}
    </div>

    <div class="mt-4">
      <slot />
    </div>
  </UCard>
</template>
