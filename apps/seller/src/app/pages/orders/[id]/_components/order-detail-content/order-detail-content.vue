<script lang="ts" setup>
import { getStatusCode } from '@arc/lib'
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import Customer from './customer.vue'
import OrderDetails from './order-details.vue'
import OrderSummary from './order-summary.vue'
import OrderTimeline from './order-timeline.vue'
import Shipments from './shipments.vue'
import ShippingAddress from './shipping-address.vue'
import { useShopGetOrderDetail } from '~/domains/shop/queries/order/detail.query'

const props = defineProps<{
  orderId: string
}>()

const {
  data,
  isPending,
  isError,
  error,
} = useShopGetOrderDetail(props.orderId)

const config = useRuntimeConfig()
const assetHost = computed(() => config.public.assetHost?.replace(/\/+$/, '') ?? '')
const order = computed(() => data.value?.order)
const timeline = computed(() => data.value?.timeline ?? [])

const isNotFound = computed(() => isError.value && getStatusCode(error.value) === 404)

const errorState = computed(() => {
  const isMissing = isNotFound.value || (!isError.value && !order.value)

  return isMissing
    ? {
        icon: ICON_NAME_BY_ALIAS['orders'],
        title: 'Order not found',
        description: 'This order may have been deleted, or the link is no longer valid.',
      }
    : {
        icon: ICON_NAME_BY_ALIAS['warning'],
        title: 'Could not load order',
        description: 'Something went wrong while loading this order. Please try again.',
      }
})
</script>

<template>
  <Empty
    v-if="isPending"
    loading
    variant="naked"
    size="xl"
    description="Loading order..."
    container-class="min-h-[70vh]"
  />

  <Empty
    v-else-if="isError || !order"
    v-bind="errorState"
    variant="naked"
    size="xl"
    container-class="min-h-[70vh]"
  />

  <div
    v-else
    class="grid grid-cols-12 gap-6"
  >
    <div class="col-span-12 space-y-6 xl:col-span-9">
      <OrderSummary
        :order="order"
        :asset-host="assetHost"
      />
      <Shipments :order="order" />
      <OrderTimeline
        :order="order"
        :timeline="timeline"
      />
    </div>

    <div class="col-span-12 space-y-6 xl:col-span-3">
      <OrderDetails :order="order" />
      <Customer :order="order" />
      <ShippingAddress :order="order" />
    </div>
  </div>
</template>
