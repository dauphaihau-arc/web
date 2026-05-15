<script lang="ts" setup>
import LoadingSvg from '~/shared/components/loading-svg.vue'
import OrderShopItem from '~/modules/pages/orders/order-shop-item.vue'
import { useGetOrderShops } from '~/shared/services/order'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const tabs = [
  {
    slot: 'orders',
    label: 'All Orders',
    content: '',
  }, {
    slot: 'not-shipped',
    label: 'Not Shipped',
    disabled: true,
    content: '',
  }, {
    slot: 'canceled',
    label: 'Canceled',
    disabled: true,
    content: '',
  },
]

const {
  data: dataGetOrderShops,
  isPending: isPendingGetOrders,
} = useGetOrderShops({
  limit: 10,
  page: 1,
})
</script>

<template>
  <div class="mt-8">
    <div
      v-if="isPendingGetOrders"
      class="grid h-[80vh] w-full place-content-center"
    >
      <LoadingSvg :child-class="'!w-12 !h-12'" />
    </div>
    <div v-else-if="dataGetOrderShops?.order_shops && dataGetOrderShops.order_shops.length > 0">
      <h1 class="mb-4 text-2xl">
        Products you’ve ordered.
      </h1>
      <UTabs
        :items="tabs"
        class="mb-12"
        :ui="{ list: { base: '!w-2/4 mb-12' } }"
      >
        <template #orders>
          <div class="ml-2 space-y-12">
            <div
              v-for="orderShop in dataGetOrderShops.order_shops"
              :key="orderShop.id"
            >
              <OrderShopItem :order-shop="orderShop" />
            </div>
          </div>
        </template>
      </UTabs>
    </div>

    <div
      v-else
      class="text-center"
    >
      <h3 class="text-3xl text-customGray-950">
        Your orders is empty.
      </h3>
    </div>
  </div>
</template>
