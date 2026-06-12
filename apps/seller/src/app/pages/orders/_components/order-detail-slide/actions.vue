<script lang="ts" setup>
import AppIcon from '@arc/ui/app-icon.vue'
import SellerCancelOrderDialog from '../seller-cancel-order-dialog.vue'
import SellerRefundOrderDialog from '../seller-refund-order-dialog.vue'
import type { ShopOrder } from '~/shared/types/shop-order-detail'
import { useOrderActions } from '~/app/pages/orders/[id]/_components/order-detail-content/use-order-actions'
import { useShopUpdateOrderShipment } from '~/shared/server-state/shop/order/update-shipment.mutation'

const props = defineProps<{
  order: ShopOrder
}>()

const dialog = useModal()
const { mutateAsync: updateShipment, isPending: isShipmentPending } = useShopUpdateOrderShipment()
const {
  canCancel,
  canRefund,
  canRetryRefund,
  canTransitionTo,
  primaryShipmentAction,
} = useOrderActions(() => props.order)

async function handleShipmentAction() {
  if (!primaryShipmentAction.value || !canTransitionTo(primaryShipmentAction.value.status)) {
    return
  }

  await updateShipment({
    orderId: props.order.id,
    body: {
      shipping_status: primaryShipmentAction.value.status,
    },
  })
}

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
  !!primaryShipmentAction.value,
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
      v-if="primaryShipmentAction"
      color="primary"
      class="justify-center gap-2"
      :loading="isShipmentPending"
      size="md"
      @click="handleShipmentAction"
    >
      <AppIcon
        :name="primaryShipmentAction.icon"
        size="sm"
      />
      {{ primaryShipmentAction.label }}
    </UButton>

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
