<script setup lang="ts">
import dayjs from 'dayjs'
import type { ElementType } from '@arc/contracts/utils'
import { formatMinorCurrency } from '@arc/utils'
import NoteAndPromoCoupons from './note-and-promo-coupons.vue'
import PaymentAndSummaryOrder from './payment-and-summary-order.vue'
import ShopActions from './shop-actions/shop-actions.vue'
import ShopProduct from './shop-product.vue'
import ShopShippingInfo from './shop-shipping-info.vue'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract'
import {
  mergeOrderShopWithLiveUpdate,
  useOrderLiveUpdates,
} from '~/shared/realtime/order-live-updates'

const props = withDefaults(defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
  allowPostPurchaseActions?: boolean
  showDetailLink?: boolean
  showReviewCta?: boolean
}>(), {
  allowPostPurchaseActions: true,
  showDetailLink: true,
  showReviewCta: true,
})

const orderedAt = computed(() => {
  if (dayjs(props.orderShop.created_at).isValid()) {
    return dayjs(props.orderShop.created_at).format('MMM DD, YYYY')
  }
  return ''
})

const { getUpdate } = useOrderLiveUpdates()

const displayOrderShop = computed(() =>
  mergeOrderShopWithLiveUpdate(
    props.orderShop,
    getUpdate(props.orderShop.id),
  ),
)
</script>

<template>
  <div class="mb-16 grid grid-cols-12 gap-16">
    <div class="col-span-8">
      <UCard class="relative">
        <div class="shadow-border absolute -left-1 -top-4 flex w-[101%] items-center justify-between rounded-md border border-border-subtle bg-surface-muted px-4 py-3 text-text-muted">
          <div>
            <div class="text-xs font-medium uppercase tracking-[0.14em] text-text-muted">
              {{ displayOrderShop.order_number }}
            </div>
            Ordered from
            <UTooltip text="redirect to homepage shop not available">
              <span class="text-text-strong underline underline-offset-2">{{ props.orderShop?.shop?.shop_name }}</span>
            </UTooltip>
            on {{ orderedAt }}
          </div>
          <div class="flex items-center gap-3">
            <div>
              {{ formatMinorCurrency(displayOrderShop.total_minor, displayOrderShop.currency) }}
            </div>
          </div>
        </div>

        <div
          v-for="(product, idx) of displayOrderShop.products"
          :key="idx"
        >
          <ShopProduct :product-order="product" />
        </div>

        <UDivider
          class="mb-3 mt-6"
        />
        <NoteAndPromoCoupons :order-shop="displayOrderShop" />
        <PaymentAndSummaryOrder :order-shop="displayOrderShop" />
      </UCard>
    </div>

    <div class="col-span-3 -mt-4 w-5/6">
      <ShopShippingInfo :order-shop="displayOrderShop" />
      <ShopActions
        v-if="props.allowPostPurchaseActions"
        :order-shop="displayOrderShop"
        :show-view-order-link="props.showDetailLink"
        :show-review-cta="props.showReviewCta"
      />
    </div>
  </div>
</template>

<style scoped>

</style>
