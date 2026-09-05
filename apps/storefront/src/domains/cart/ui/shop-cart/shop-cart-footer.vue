<script setup lang="ts">
const slots = useSlots()
</script>

<template>
  <div class="mt-6 flex justify-between">
    <div class="w-fit">
      <slot name="coupons" />

      <slot name="note" />
    </div>

    <slot
      v-if="slots.shipping"
      name="shipping"
    />
  </div>
</template>
