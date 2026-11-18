<script setup lang="ts">
import { FulfillmentAggregateStatuses } from '@arc/enums/fulfillment'
import { OrderStatuses } from '@arc/enums/order'
import type { ElementType } from '@arc/contracts/utils'
import WriteProductReviewDialog from './write-product-review-dialog/write-product-review-dialog.vue'
import OrderCancelRequestDialog from './order-cancel-request-dialog.vue'
import OrderSupportRequestDialog from './order-support-request-dialog.vue'
import type { GetOrderShopsResponse } from '~/domains/me/api/order/contracts/order.contract'
import { routes } from '~/shared/navigation/routes'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'

const props = withDefaults(defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
  showViewOrderLink?: boolean
  showReviewCta?: boolean
  orientation?: 'stack' | 'inline'
}>(), {
  showViewOrderLink: true,
  showReviewCta: false,
  orientation: 'stack',
})

const dialog = useModal()
const t = useAccountTranslator()
const { localizePath } = useLocalizedRoute()

const viewOrderPath = computed(() => localizePath(routes.orderDetail(props.orderShop.id)))

const canCancelOrder = computed(() =>
  [OrderStatuses.PAID, OrderStatuses.PENDING].includes(props.orderShop.status)
  && [FulfillmentAggregateStatuses.UNFULFILLED, FulfillmentAggregateStatuses.PREPARED].includes(props.orderShop.fulfillment.status),
)

const canWriteReview = computed(() =>
  props.showReviewCta
  && props.orderShop.products.length > 0
  && props.orderShop.status !== OrderStatuses.CANCELED
  && props.orderShop.status !== OrderStatuses.REFUNDED
  && (
    props.orderShop.status === OrderStatuses.COMPLETED
    || props.orderShop.fulfillment.status === FulfillmentAggregateStatuses.DELIVERED
  ),
)
const hasReviewedAllProducts = computed(() =>
  props.orderShop.products.length > 0
  && props.orderShop.products.every(product => Boolean(product.my_review)),
)
const reviewButtonLabel = computed(() =>
  hasReviewedAllProducts.value
    ? t('account.orders.actions.editReview')
    : t('account.orders.actions.writeReview'),
)

function openCancelDialog() {
  dialog.open(OrderCancelRequestDialog, {
    orderId: props.orderShop.id,
  })
}

function openSupportDialog() {
  dialog.open(OrderSupportRequestDialog, {
    orderId: props.orderShop.id,
    initialNote: props.orderShop.customer_support_note,
  })
}

function openReviewDialog() {
  dialog.open(WriteProductReviewDialog, {
    orderShop: props.orderShop,
  })
}
</script>

<template>
  <div>
    <div
      :class="props.orientation === 'inline'
        ? 'flex flex-wrap items-center justify-end gap-2'
        : 'mt-4 flex flex-col gap-4'"
    >
      <UButton
        v-if="props.showViewOrderLink"
        :block="props.orientation === 'stack'"
        size="md"
        color="gray"
        :to="viewOrderPath"
      >
        {{ t('account.orders.actions.viewOrder') }}
      </UButton>
      <UButton
        v-if="canWriteReview"
        :block="props.orientation === 'stack'"
        size="md"
        @click="openReviewDialog"
      >
        {{ reviewButtonLabel }}
      </UButton>
      <UButton
        :block="props.orientation === 'stack'"
        size="md"
        color="gray"
        @click="openSupportDialog"
      >
        {{ t('account.orders.actions.helpWithOrder') }}
      </UButton>
      <UButton
        v-if="canCancelOrder"
        :block="props.orientation === 'stack'"
        size="md"
        color="gray"
        @click="openCancelDialog"
      >
        {{ t('account.orders.actions.cancelOrder') }}
      </UButton>
      <!--      <UTooltip text="Feature not available"> -->
      <!--        <UButton -->
      <!--          block -->
      <!--          size="md" -->
      <!--          color="gray" -->
      <!--        > -->
      <!--          View receipt -->
      <!--        </UButton> -->
      <!--      </UTooltip> -->
    </div>
  </div>
</template>

<style scoped>

</style>
