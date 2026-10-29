<script lang="ts" setup>
import Timeline from '@arc/ui/patterns/timeline.vue'
import { routes } from '~/shared/navigation/routes'
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
</script>

<template>
  <UCard>
    <div class="text-lg font-semibold">
      Order progress
    </div>

    <Timeline
      class="mt-6"
      :items="steps"
      orientation="horizontal"
      aria-label="Seller order progress"
    >
      <template #title="{ item }">
        <span :class="item.key === 'payout' ? 'font-normal' : undefined">{{ item.title }}</span>
      </template>
      <template #description="{ item, state }">
        <NuxtLink
          v-if="item.key === 'payout' && item.description === 'Add bank account'"
          :to="routes.finances()"
          class="mt-1 inline-block text-xs text-text-muted underline"
        >
          {{ item.description }}
        </NuxtLink>
        <div
          v-else-if="item.description"
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
