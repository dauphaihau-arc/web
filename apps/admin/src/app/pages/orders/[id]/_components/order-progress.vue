<script setup lang="ts">
import type { ProgressStep, ProgressStepState } from '@arc/ui/patterns/progress-steps.vue'
import ProgressSteps from '@arc/ui/patterns/progress-steps.vue'
import { computed } from 'vue'
import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract'
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

function toProgressState(state?: string): ProgressStepState {
  switch (state) {
    case 'completed':
      return 'completed'
    case 'active':
      return 'current'
    case 'failed':
      return 'failed'
    default:
      return 'upcoming'
  }
}

const progressSteps = computed<ProgressStep[]>(() =>
  steps.value.map((step, index) => ({
    key: step.key ?? String(index),
    label: step.title,
    date: step.date,
    description: step.description,
    state: toProgressState(step.state),
  })),
)
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Order progress
    </div>

    <ProgressSteps
      class="mt-5"
      :steps="progressSteps"
      aria-label="Order progress"
    />
  </UCard>
</template>
