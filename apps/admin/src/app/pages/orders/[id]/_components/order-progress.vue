<script setup lang="ts">
import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract'
import Timeline from '@arc/ui/patterns/timeline.vue'
import { useAdminOrderFinancialBreakdown } from '~/domains/orders/queries/financial-breakdown.query'
import { useAdminOrderProgress } from '../_composables/use-admin-order-progress'

const props = defineProps<{
  order: AdminOrderDetailOrder
}>()

/**
 * The pricing breakdown already reads this order's financial breakdown under
 * the same query key, so the progress strip shares that cached read instead of
 * opening a second request path.
 */
const breakdownQuery = useAdminOrderFinancialBreakdown(() => props.order.id)

const steps = useAdminOrderProgress(() => props.order, breakdownQuery.data)
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Order progress
    </div>

    <Timeline
      class="mt-5"
      :items="steps"
      orientation="horizontal"
      aria-label="Order progress"
    >
      <template #title="{ item }">
        <span :class="item.key === 'payout' ? 'font-normal' : undefined">{{ item.title }}</span>
      </template>
      <template #description="{ item, state }">
        <div
          v-if="item.description"
          class="mt-1 text-xs"
          :class="{
            'text-state-warning-text': state === 'active' && item.key !== 'payout',
            'text-state-danger-text': state === 'failed',
            'text-text-muted': state !== 'failed' && (state !== 'active' || item.key === 'payout'),
          }"
        >
          {{ item.description }}
        </div>
      </template>
    </Timeline>
  </UCard>
</template>
