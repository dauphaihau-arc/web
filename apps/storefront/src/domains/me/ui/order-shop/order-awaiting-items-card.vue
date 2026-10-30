<script setup lang="ts">
import type { OrderPackageLine } from './order-detail-presentation'
import OrderItemLines from './order-item-lines.vue'

defineOptions({ name: 'OrderAwaitingItemsCard' })

defineProps<{
  lines: OrderPackageLine[]
}>()
</script>

<template>
  <UCard :ui="{ divide: 'divide-y-0' }">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h3 class="text-base font-medium text-text-strong">
        Items awaiting shipment
      </h3>

      <div class="text-sm text-text-subtle">
        No tracking number yet
      </div>
    </div>

    <OrderItemLines
      :lines="lines"
      class="mt-4"
    />
  </UCard>
</template>
