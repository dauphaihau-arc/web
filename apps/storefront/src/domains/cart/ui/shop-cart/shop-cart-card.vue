<script setup lang="ts">
const props = defineProps<{
  shopName?: string
}>()
</script>

<template>
  <UCard
    :ui="{ base: 'overflow-visible' }"
    class="mb-4"
  >
    <div class="flex flex-col">
      <div class="mb-3 flex items-center gap-2">
        <AppIcon
          name="shop"
          size="lg"
        />
        <h3 class="text-lg font-medium">
          {{ props.shopName }}
        </h3>
      </div>

      <div>
        <slot />
      </div>

      <UDivider />

      <slot name="footer" />
    </div>
  </UCard>
</template>
