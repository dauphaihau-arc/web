<script setup lang="ts">
import dayjs from 'dayjs'
import { OrderShippingStatuses } from '@arc/enums/order'
import type { ElementType } from '@arc/contracts/utils'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract'

const { orderShop } = defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
}>()

const shippingStatus = {
  [OrderShippingStatuses.SHIPPED]: 'Shipped',
  [OrderShippingStatuses.PRE_TRANSIT]: 'Pre-transit',
  [OrderShippingStatuses.IN_TRANSIT]: 'In transit',
  [OrderShippingStatuses.DELIVERED]: 'Delivered',
}

const estimatedDelivery = computed(() => {
  if (dayjs(orderShop.shipping.estimated_delivery).isValid()) {
    return dayjs(orderShop.shipping.estimated_delivery).format('MMM DD')
  }
  return ''
})

const shippingStatusUpdatedAt = computed(() => {
  if (dayjs(orderShop.shipping.updated_at).isValid()) {
    return dayjs(orderShop.shipping.updated_at).format('MMM DD, YYYY')
  }
  return ''
})

const fromCountries = computed(() => {
  if (!orderShop.shipping.from_countries) return
  return orderShop.shipping.from_countries.toString().replace(',', ', ')
})

const shippedAt = computed(() => {
  if (orderShop.shipping.shipped_at && dayjs(orderShop.shipping.shipped_at).isValid()) {
    return dayjs(orderShop.shipping.shipped_at).format('MMM DD, YYYY')
  }
  return ''
})

const deliveredAt = computed(() => {
  if (orderShop.shipping.delivered_at && dayjs(orderShop.shipping.delivered_at).isValid()) {
    return dayjs(orderShop.shipping.delivered_at).format('MMM DD, YYYY')
  }
  return ''
})
</script>

<template>
  <div>
    <div class="text-2xl font-medium">
      {{ shippingStatus[orderShop?.shipping?.shipping_status] }}
    </div>
    <div class="mt-2 space-y-5 text-[15px] text-zinc-500">
      <div class="space-y-1.5">
        <div>
          On {{ shippingStatusUpdatedAt }}
        </div>
        <div>
          From {{ fromCountries }} to {{ orderShop?.shipping?.to_country }}
        </div>
      </div>
      <div>
        Estimated delivery: {{ estimatedDelivery }}
      </div>
      <div v-if="orderShop.shipping.tracking_number || orderShop.shipping.shipping_carrier">
        <div v-if="orderShop.shipping.shipping_carrier">
          Carrier: {{ orderShop.shipping.shipping_carrier }}
        </div>
        <div v-if="orderShop.shipping.tracking_number">
          Tracking: {{ orderShop.shipping.tracking_number }}
        </div>
      </div>
      <div v-if="orderShop.shipping.shipment_note">
        Shipment note: {{ orderShop.shipping.shipment_note }}
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
