<script lang="ts" setup>
import LoadingSvg from '@arc/ui/loading-svg.vue'
import CustomerCard from './customer-card.vue'
import OrderOverviewCard from './order-overview-card.vue'
import OrderSummaryCard from './order-summary-card.vue'
import ShipmentUpdateCard from './shipment-update-card.vue'
import ShippingAddressCard from './shipping-address-card.vue'
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
    <div class="col-span-12 space-y-6 xl:col-span-7">
      <OrderOverviewCard
        :order="order"
        :asset-host="assetHost"
      />
      <ShipmentUpdateCard :order="order" />
    </div>

    <div class="col-span-12 space-y-6 xl:col-span-5">
      <CustomerCard :order="order" />
      <ShippingAddressCard :order="order" />
      <OrderSummaryCard :order="order" />
    </div>
  </div>

  <div
    v-else
    class="rounded-md border border-border-subtle bg-surface p-6 text-sm text-text-muted"
  >
    Order not found.
  </div>
</template>
