<script setup lang="ts">
/**
 * Layout shell for a shop card's footer: promo codes and note on the left, the
 * money summary on the right.
 */
const props = withDefaults(defineProps<{
  /**
   * Width of the summary column. The checkout review's summary carries the
   * money breakdown plus the delivery estimate, so those pages widen the
   * column; the cart's shorter summary keeps the narrower default.
   */
  summaryClass?: string
}>(), {
  summaryClass: 'w-[30%]',
})

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
      :class="props.summaryClass"
    >
      <slot name="summary" />
    </div>
  </div>
</template>
