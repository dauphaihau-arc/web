<script setup lang="ts">
import { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'
import type { ElementType } from '@arc/contracts/utils'
import OrderCancelRequestDialog from '~/app/components/dialogs/order-cancel-request-dialog.vue'
import OrderSupportRequestDialog from '~/app/components/dialogs/order-support-request-dialog.vue'
import WriteProductReviewDialog from '~/app/components/dialogs/write-product-review-dialog.vue'
import type { GetOrderShopsResponse } from '~/shared/api/me/order/contracts/order.contract'

const props = withDefaults(defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
  showViewOrderLink?: boolean
  showReviewCta?: boolean
}>(), {
  showViewOrderLink: true,
  showReviewCta: false,
})

const dialog = useModal()

const canCancelOrder = computed(() =>
  [OrderStatuses.PAID, OrderStatuses.PENDING].includes(props.orderShop.status)
  && props.orderShop.shipping.shipping_status === OrderShippingStatuses.PRE_TRANSIT,
)

const canWriteReview = computed(() =>
  props.showReviewCta
  && props.orderShop.products.length > 0
  && props.orderShop.status !== OrderStatuses.CANCELED
  && props.orderShop.status !== OrderStatuses.REFUNDED
  && (
    props.orderShop.status === OrderStatuses.COMPLETED
    || props.orderShop.shipping.shipping_status === OrderShippingStatuses.DELIVERED
  ),
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
    <div class="mt-4 flex flex-col gap-4">
      <UButton
        v-if="canWriteReview"
        block
        size="md"
        @click="openReviewDialog"
      >
        Write review
      </UButton>
      <UButton
        block
        size="md"
        color="gray"
        @click="openSupportDialog"
      >
        Help with order
      </UButton>
      <UButton
        block
        size="md"
        color="gray"
        :disabled="!canCancelOrder"
        @click="openCancelDialog"
      >
        Cancel order
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
