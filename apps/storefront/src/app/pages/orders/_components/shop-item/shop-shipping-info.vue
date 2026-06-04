<script setup lang="ts">
import dayjs from 'dayjs'
import { OrderShippingStatuses } from '@arc/enums/order'
import type { ElementType } from '@arc/contracts/utils'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract'

const props = defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
}>()

const shippingStatus = {
  [OrderShippingStatuses.SHIPPED]: 'Shipped',
  [OrderShippingStatuses.PRE_TRANSIT]: 'Pre-transit',
  [OrderShippingStatuses.IN_TRANSIT]: 'In transit',
  [OrderShippingStatuses.DELIVERED]: 'Delivered',
}

const estimatedDelivery = computed(() => {
  if (dayjs(props.orderShop.shipping.estimated_delivery).isValid()) {
    return dayjs(props.orderShop.shipping.estimated_delivery).format('MMM DD')
  }
  return ''
})

const shippingStatusUpdatedAt = computed(() => {
  if (dayjs(props.orderShop.shipping.updated_at).isValid()) {
    return dayjs(props.orderShop.shipping.updated_at).format('MMM DD, YYYY')
  }
  return ''
})

const fromCountries = computed(() => {
  if (!props.orderShop.shipping.from_countries) return
  return props.orderShop.shipping.from_countries.toString().replace(',', ', ')
})

const shippedAt = computed(() => {
  if (props.orderShop.shipping.shipped_at && dayjs(props.orderShop.shipping.shipped_at).isValid()) {
    return dayjs(props.orderShop.shipping.shipped_at).format('MMM DD, YYYY')
  }
  return ''
})

const deliveredAt = computed(() => {
  if (props.orderShop.shipping.delivered_at && dayjs(props.orderShop.shipping.delivered_at).isValid()) {
    return dayjs(props.orderShop.shipping.delivered_at).format('MMM DD, YYYY')
  }
  return ''
})
</script>

<template>
  <div>
    <div class="text-2xl font-medium">
      {{ shippingStatus[props.orderShop?.shipping?.shipping_status] }}
    </div>
    <div class="mt-2 space-y-5 text-[15px] text-zinc-500">
      <div class="space-y-1.5">
        <div>
          On {{ shippingStatusUpdatedAt }}
        </div>
        <div>
          From {{ fromCountries }} to {{ props.orderShop?.shipping?.to_country }}
        </div>
      </div>
      <div>
        Estimated delivery: {{ estimatedDelivery }}
      </div>
      <div v-if="props.orderShop.shipping.tracking_number || props.orderShop.shipping.shipping_carrier">
        <div v-if="props.orderShop.shipping.shipping_carrier">
          Carrier: {{ props.orderShop.shipping.shipping_carrier }}
        </div>
        <div v-if="props.orderShop.shipping.tracking_number">
          Tracking: {{ props.orderShop.shipping.tracking_number }}
        </div>
      </div>
      <div v-if="props.orderShop.shipping.shipment_note">
        Shipment note: {{ props.orderShop.shipping.shipment_note }}
      </div>
      <div v-if="shippedAt">
        Shipped on {{ shippedAt }}
      </div>
      <div v-if="deliveredAt">
        Delivered on {{ deliveredAt }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
