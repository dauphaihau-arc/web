<script setup lang="ts">
import Timeline from '@arc/ui/patterns/timeline.vue'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import { buildOrderProgressSteps } from './order-progress'

type OrderShop = GetOrderShopsResponse['order_shops'][number]

const props = defineProps<{
  orderShop: OrderShop
}>()

const steps = computed(() => buildOrderProgressSteps(props.orderShop))
</script>

<template>
  <UCard>
    <template #header>
      <div class="font-medium">
        Order progress
      </div>
    </template>

    <Timeline
      :items="steps"
      orientation="horizontal"
      aria-label="Order progress"
    />
  </UCard>
</template>
