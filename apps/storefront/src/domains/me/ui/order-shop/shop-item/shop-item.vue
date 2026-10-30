<script setup lang="ts">
import dayjs from 'dayjs'
import type { ElementType } from '@arc/contracts/utils'
import { formatMinorCurrency } from '@arc/utils'
import NoteAndPromoCodes from './note-and-promo-codes.vue'
import OrderItemsTable from '../order-items-table.vue'
import PaymentAndSummaryOrder from './payment-and-summary-order.vue'
import ShopActions from '../shop-actions/shop-actions.vue'
import ShopShippingInfo from './shop-shipping-info.vue'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import { routes } from '~/shared/navigation/routes'
import {
  mergeOrderShopWithLiveUpdate,
  useOrderLiveUpdates,
} from '~/domains/me/realtime/order-live-updates'

const props = withDefaults(defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
  allowPostPurchaseActions?: boolean
  fulfillmentDisplay?: 'summary' | 'detail'
  showDetailLink?: boolean
  showReviewCta?: boolean
  showFulfillment?: boolean
  showOrderSummaryStrip?: boolean
  title?: string
  ui?: { divide?: string }
}>(), {
  allowPostPurchaseActions: true,
  fulfillmentDisplay: 'summary',
  showDetailLink: true,
  showReviewCta: true,
  showFulfillment: true,
  showOrderSummaryStrip: true,
  title: undefined,
  ui: undefined,
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

const itemRows = computed(() => displayOrderShop.value.products.map((product) => {
  const originalUnitPriceMinor = product.original_amount_minor
  const unitPriceMinor = product.amount_minor
  const percentOff = originalUnitPriceMinor != null && originalUnitPriceMinor > 0
    ? Math.round(((originalUnitPriceMinor - unitPriceMinor) / originalUnitPriceMinor) * 100)
    : null

  return {
    id: product.id,
    title: product.title,
    imageUrl: product.image_url,
    variantLabels: product.product.selected_options
      .map(option => `${option.option_name}: ${option.value}`),
    quantity: product.quantity,
    unitPriceMinor,
    originalUnitPriceMinor,
    percentOff,
    currency: displayOrderShop.value.currency,
  }
}))

const productLinkByItemId = computed(() => new Map(
  displayOrderShop.value.products.map(product => [
    product.id,
    routes.productDetail(product.product.shop.slug, product.product.slug),
  ]),
))

/**
 * Below `lg` the fulfillment/actions column is collapsed: this component owns
 * no detail page (the order detail view and the guest lookup both pass
 * `show-detail-link: false`), so its status and post-purchase actions stay on
 * screen. Otherwise the card itself carries the link to the detail page.
 */
const detailLink = computed(() =>
  props.showDetailLink ? routes.orderDetail(props.orderShop.id) : undefined,
)
</script>

<template>
  <div class="mb-16 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
    <div :class="props.showFulfillment ? 'lg:col-span-8' : 'lg:col-span-12'">
      <UCard
        class="relative"
        :class="props.showOrderSummaryStrip && 'md:pt-10'"
        :ui="props.ui"
      >
        <template
          v-if="props.title"
          #header
        >
          <div class="font-medium">
            {{ props.title }}
          </div>
        </template>

        <NuxtLink
          v-if="detailLink"
          :to="detailLink"
          class="absolute inset-0 z-0 lg:hidden"
          :aria-label="`View order ${displayOrderShop.order_number}`"
        />
        <div
          v-if="props.showOrderSummaryStrip"
          class="mb-4 flex flex-col gap-1 rounded-md border border-border-subtle bg-surface-muted px-4 py-3 text-text-muted shadow-border md:absolute md:-left-1 md:-top-4 md:mb-0 md:w-[101%] md:flex-row md:items-center md:justify-between md:gap-0"
        >
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

        <OrderItemsTable :rows="itemRows">
          <template #row-actions="{ row }">
            <UButton
              :to="productLinkByItemId.get(row.id)"
              class="relative z-10"
              variant="link"
              :padded="false"
              size="sm"
            >
              Buy this again
            </UButton>
          </template>
        </OrderItemsTable>

        <UDivider
          class="mb-3 mt-6"
        />
        <NoteAndPromoCodes :order-shop="displayOrderShop" />
        <PaymentAndSummaryOrder :order-shop="displayOrderShop" />
      </UCard>
    </div>

    <div
      v-if="props.showFulfillment"
      class="w-full lg:col-span-3 lg:-mt-4 lg:w-5/6"
      :class="detailLink && 'hidden lg:block'"
    >
      <ShopShippingInfo
        :order-shop="displayOrderShop"
        :display="props.fulfillmentDisplay"
      />
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
