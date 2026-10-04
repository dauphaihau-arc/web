<script setup lang="ts">
const slots = useSlots()
</script>

<template>
  <div class="mt-6 flex justify-between gap-10">
    <div class="flex-1 space-y-3">
      <slot name="promo-codes" />
      <slot name="note" />
    </div>

    <div
      v-if="slots.summary"
      class="w-2/5"
    >
      <slot name="summary" />
    </div>
  </div>
</template>
