<script setup lang="ts">
import { PaymentTypes } from '@arc/enums/order'
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated'
import { useAdminOrderDetail } from '~/domains/orders/queries/detail.query'
import {
  ADMIN_ORDER_ACTION_STATUSES,
  readRefundStatus,
} from '~/domains/orders/utils/order-presentation'
import { usePermissions } from '~/shared/composables/use-permissions'

const props = defineProps<{
  orderId: string
}>()

const dialog = useModal()
const { can } = usePermissions()
const canManageOrders = computed(() => can(PERMISSIONS.ordersManage))
const { data } = useAdminOrderDetail(() => props.orderId)
const order = computed(() => data.value?.order)
const refundStatus = computed(() => (order.value ? readRefundStatus(order.value) : undefined))

const canChangeStatus = computed(() =>
  !!order.value
  && ADMIN_ORDER_ACTION_STATUSES.some(status => status !== order.value?.status),
)

// The refund endpoint rejects non-card payments, and a settled refund has no
// remaining operator action, so neither exposes the dialog.
const canManageRefund = computed(() =>
  order.value?.payment.type === PaymentTypes.CARD
  && refundStatus.value !== 'succeeded'
  && refundStatus.value !== 'not_required',
)

const showPermissionNote = computed(() =>
  !canManageOrders.value && (canChangeStatus.value || canManageRefund.value),
)

async function openStatusDialog() {
  if (!order.value) {
    return
  }

  const component = await import('./order-status-dialog.vue')

  dialog.open(component.default, {
    orderId: props.orderId,
    currentStatus: order.value.status,
  })
}

async function openRefundDialog() {
  if (!order.value) {
    return
  }

  const component = await import('./order-refund-dialog.vue')

  dialog.open(component.default, {
    orderId: props.orderId,
    refundStatus: refundStatus.value,
  })
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-3">
    <UButton
      v-if="canManageOrders && canChangeStatus"
      color="gray"
      @click="openStatusDialog"
    >
      Update status
    </UButton>

    <UButton
      v-if="canManageOrders && canManageRefund"
      color="red"
      @click="openRefundDialog"
    >
      Update refund
    </UButton>

    <p
      v-if="showPermissionNote"
      class="text-sm text-text-subtle"
    >
      Ask a platform administrator for order management access.
    </p>
  </div>
</template>
