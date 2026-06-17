<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import Customer from './customer.vue'
import OrderDetails from './order-details.vue'
import OrderSummary from './order-summary.vue'
import OrderTimeline from './order-timeline.vue'
import ShippingAddress from './shipping-address.vue'
import { useShopGetOrderDetail } from '~/shared/server-state/shop/order/detail.query'

const props = defineProps<{
  orderId: string
}>()

const {
  data,
  isPending,
} = useShopGetOrderDetail(props.orderId)

const config = useRuntimeConfig()
const assetHost = computed(() => config.public.assetHost?.replace(/\/+$/, '') ?? '')
const order = computed(() => data.value?.order)
const timeline = computed(() => data.value?.timeline ?? [])
</script>

<template>
  <div
    v-if="isPending"
    class="grid h-[70vh] w-full place-content-center"
  >
    <LoadingSvg :child-class="'!w-12 !h-12'" />
  </div>

  <div
    v-else-if="order"
    class="grid grid-cols-12 gap-6"
  >
    <div class="col-span-12 space-y-6 xl:col-span-9">
      <OrderSummary
        :order="order"
        :asset-host="assetHost"
      />
      <OrderTimeline
        :order="order"
        :timeline="timeline"
      />
      <!--      <ShipmentUpdate :order="order" /> -->
    </div>

    <div class="col-span-12 space-y-6 xl:col-span-3">
      <OrderDetails :order="order" />
      <Customer :order="order" />
      <ShippingAddress :order="order" />
    </div>
  </div>

  <div
    v-else
    class="rounded-md border border-border-subtle bg-surface p-6 text-sm text-text-muted"
  >
    Order not found.
  </div>
</template>
