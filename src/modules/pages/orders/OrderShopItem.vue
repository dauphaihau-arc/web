<script setup lang="ts">
import dayjs from 'dayjs'
import type { ElementType } from '~/types/utils'
import type { ResponseGetOrderShops } from '~/types/request-api/order'

const { orderShop } = defineProps<{
  orderShop: ElementType<ResponseGetOrderShops['order_shops']>
}>()

const orderedAt = computed(() => {
  if (dayjs(orderShop.created_at).isValid()) {
    return dayjs(orderShop.created_at).format('MMM DD, YYYY')
  }
  return ''
})
</script>

<template>
  <div class="mb-16 grid grid-cols-12 gap-16">
    <div class="col-span-8">
      <UCard class="relative">
        <div class="shadow-border absolute -left-1 -top-4 flex w-[101%] items-center justify-between rounded-md border border-zinc-200/50 bg-[#f5f5f5] px-4 py-3 text-zinc-500">
          <div>
            Ordered from
            <UTooltip text="redirect to homepage shop not available">
              <span class="text-customGray-900 underline underline-offset-2">{{ orderShop?.shop?.shop_name }}</span>
            </UTooltip>
            on {{ orderedAt }}
          </div>
          <div class="">
            {{ convertCurrency(orderShop.total) }}
          </div>
        </div>

        <div
          v-for="(product, idx) of orderShop.products"
          :key="idx"
        >
          <OrderShopProduct :product-order="product" />
        </div>

        <UDivider
          class="mb-3 mt-6"
        />
        <OrderNoteAndPromoCoupons :order-shop="orderShop" />
        <OrderPaymentAndSummaryOrder :order-shop="orderShop" />
      </UCard>
    </div>

    <div class="col-span-3 -mt-4 w-5/6">
      <OrderShopShippingInfo :order-shop="orderShop" />
      <OrderShopActions />
    </div>
  </div>
</template>

<style scoped>

</style>
