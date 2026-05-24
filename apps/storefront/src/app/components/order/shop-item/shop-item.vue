<script setup lang="ts">
import dayjs from 'dayjs'
import type { ElementType } from '@arc/contracts/utils'
import NoteAndPromoCoupons from './note-and-promo-coupons.vue'
import PaymentAndSummaryOrder from './payment-and-summary-order.vue'
import ShopActions from './shop-actions.vue'
import ShopProduct from './shop-product.vue'
import ShopShippingInfo from './shop-shipping-info.vue'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract'

const props = withDefaults(defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
  allowPostPurchaseActions?: boolean
  showDetailLink?: boolean
}>(), {
  allowPostPurchaseActions: true,
  showDetailLink: true,
})

const orderedAt = computed(() => {
  if (dayjs(props.orderShop.created_at).isValid()) {
    return dayjs(props.orderShop.created_at).format('MMM DD, YYYY')
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
              <span class="text-customGray-900 underline underline-offset-2">{{ props.orderShop?.shop?.shop_name }}</span>
            </UTooltip>
            on {{ orderedAt }}
          </div>
          <div class="flex items-center gap-3">
            <div>
              {{ convertCurrency(props.orderShop.total) }}
            </div>
          </div>
        </div>

        <div
          v-for="(product, idx) of props.orderShop.products"
          :key="idx"
        >
          <ShopProduct :product-order="product" />
        </div>

        <UDivider
          class="mb-3 mt-6"
        />
        <NoteAndPromoCoupons :order-shop="props.orderShop" />
        <PaymentAndSummaryOrder :order-shop="props.orderShop" />
      </UCard>
    </div>

    <div class="col-span-3 -mt-4 w-5/6">
      <ShopShippingInfo :order-shop="props.orderShop" />
      <ShopActions
        v-if="props.allowPostPurchaseActions"
        :order-shop="props.orderShop"
        :show-view-order-link="props.showDetailLink"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
