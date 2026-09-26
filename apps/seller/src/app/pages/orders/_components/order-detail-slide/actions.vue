<script lang="ts" setup>
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import SellerCancelOrderDialog from '../seller-cancel-order-dialog.vue'
import SellerRefundOrderDialog from '../seller-refund-order-dialog.vue'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'
import { useOrderActions } from '~/app/pages/orders/[id]/_components/order-detail-content/use-order-actions'

const props = defineProps<{
  order: ShopOrder
}>()

const dialog = useModal()
const {
  canCancel,
  canRefund,
  canRetryRefund,
} = useOrderActions(() => props.order)

function openRefundDialog(isRetry = false) {
  dialog.open(SellerRefundOrderDialog, {
    orderId: props.order.id,
    isRetry,
  })
}

function openCancelDialog() {
  dialog.open(SellerCancelOrderDialog, {
    orderId: props.order.id,
  })
}

const visibleActionCount = computed(() => [
  canRefund.value || canRetryRefund.value,
  canCancel.value,
].filter(Boolean).length)

const actionsGridClass = computed(() => {
  switch (visibleActionCount.value) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-2'
    default:
      return 'grid-cols-3'
  }
})

const refundLabel = computed(() => canRetryRefund.value ? 'Retry refund' : 'Refund order')
</script>

<template>
  <div
    class="grid gap-3"
    :class="actionsGridClass"
  >
    <UButton
      v-if="canRefund || canRetryRefund"
      color="red"
      class="justify-center gap-2"
      size="md"
      @click="openRefundDialog(canRetryRefund)"
    >
      <AppIcon
        name="refund"
        size="sm"
      />
      {{ refundLabel }}
    </UButton>

    <UButton
      v-if="canCancel"
      color="gray"
      class="justify-center gap-2"
      size="md"
      @click="openCancelDialog"
    >
      <AppIcon
        name="xCircle"
        size="sm"
      />
      Cancel order
    </UButton>
  </div>
</template>
