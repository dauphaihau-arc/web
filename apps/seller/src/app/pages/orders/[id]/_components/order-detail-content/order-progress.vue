<script lang="ts" setup>
import ProgressSteps from '@arc/ui/patterns/progress-steps.vue'
import type { ProgressStep, ProgressStepState } from '@arc/ui/patterns/progress-steps.vue'
import { routePaths } from '~/shared/navigation/routes'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'
import { useShopGetOrderPayout } from '~/domains/shop/queries/order/order-payout.query'
import { buildOrderProgressSteps } from './order-progress.presentation'

const props = defineProps<{
  order: ShopOrder
}>()

/**
 * Payout is a Finance fact, so it loads independently of the order. While it is
 * missing or failed the progress simply shows no Payout step.
 *
 * Availability is booked from the delivery outbox, so once every unit is
 * delivered and Finance has not recorded it yet, the query polls until it does.
 */
const everyUnitDelivered = computed(() => {
  const fulfillment = props.order.fulfillment
  const total = fulfillment.progress.ordered - fulfillment.progress.canceled
  const groupedDelivered = total > 0 && fulfillment.progress.delivered >= total
  const legacy = fulfillment.legacy_shipping

  return groupedDelivered
    || Boolean(legacy.delivered_at)
    || legacy.status === 'delivered'
})

const { data: orderPayout } = useShopGetOrderPayout(
  props.order.id,
  undefined,
  { pollWhile: everyUnitDelivered },
)

const steps = computed(() => buildOrderProgressSteps(props.order, orderPayout.value))

/** Progress states carried over from `buildOrderProgressSteps`. */
const STATE_MAP: Record<string, ProgressStepState> = {
  completed: 'completed',
  active: 'current',
  pending: 'upcoming',
  failed: 'failed',
}

const progressSteps = computed<ProgressStep[]>(() =>
  steps.value.map(item => ({
    key: item.key ?? item.title,
    label: item.title,
    date: item.date,
    description: item.description,
    state: STATE_MAP[item.state ?? 'pending'] ?? 'upcoming',
    /** The payout step sends the seller to Finance to add a bank account. */
    href: item.key === 'payout' && item.description === 'Add bank account'
      ? routePaths.finances
      : undefined,
  })),
)
</script>

<template>
  <UCard>
    <div class="text-lg font-semibold">
      Order progress
    </div>

    <ProgressSteps
      class="mt-6"
      :steps="progressSteps"
      aria-label="Seller order progress"
    />
  </UCard>
</template>
