<script setup lang="ts">
import type { ElementType } from '@arc/contracts/utils'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import {
  buildOrderPackages,
  buildOrderStages,
  type OrderPackageStage,
} from './order-detail-presentation'
import PackageProgressSteps from './package-progress-steps.vue'

type OrderShop = ElementType<GetOrderShopsResponse['order_shops']>

const props = defineProps<{
  orderShop: OrderShop
}>()

const summary = computed(() => buildOrderPackages(props.orderShop))

const stages = computed<OrderPackageStage[]>(() => {
  const { packages, counts } = summary.value

  if (counts.total === 0) {
    return buildOrderStages(props.orderShop)
  }
  if (counts.total === 1) {
    return packages[0]?.stages ?? []
  }
  return []
})

/** Header sits close to the stepper, like the detail cards beside it. */
const cardUi = {
  divide: 'divide-y-0',
  header: { padding: 'px-4 pt-5 pb-0 sm:px-6 sm:pt-6 sm:pb-0' },
  body: { padding: 'px-4 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-4' },
}
</script>

<template>
  <UCard
    v-if="stages.length"
    :ui="cardUi"
  >
    <template #header>
      <div class="font-medium">
        Order progress
      </div>
    </template>

    <PackageProgressSteps
      :stages="stages"
      label="Order progress"
    />
  </UCard>
</template>
