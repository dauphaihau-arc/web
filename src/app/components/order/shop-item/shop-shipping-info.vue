<script setup lang="ts">
import dayjs from 'dayjs'
import { OrderShippingStatuses } from '~/shared/config/enums/order'
import type { ElementType } from '~/shared/contracts/utils'
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
    </div>
  </div>
</template>

<style scoped>

</style>
