<script setup lang="ts">
import type { DropdownItem } from '#ui/types'
import { PaymentTypes } from '@arc/enums/order'
import { PERMISSIONS } from '@arc/schemas/api/auth/permissions.generated'
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import { useAdminOrderDetail } from '~/domains/orders/queries/detail.query'
import {
  ADMIN_ORDER_ACTION_STATUSES,
  readRefundStatus,
} from '~/domains/orders/utils/order-presentation'
import { usePermissions } from '~/domains/me/composables/use-permissions'

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

// One group per action so the menu renders them as separated rows; an action
// whose gate fails contributes no group, and no actions hides the trigger.
const actionMenuGroups = computed<DropdownItem[][]>(() => [
  ...(canManageOrders.value && canChangeStatus.value
    ? [[{
        label: 'Update status',
        icon: 'lucide:circle-dot',
        click: openStatusDialog,
      }]]
    : []),
  ...(canManageOrders.value && canManageRefund.value
    ? [[{
        label: 'Update refund',
        icon: 'lucide:banknote',
        class: 'text-red-600',
        click: openRefundDialog,
      }]]
    : []),
])

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
    <UDropdown
      v-if="actionMenuGroups.length"
      :items="actionMenuGroups"
      :popper="{ placement: 'bottom-end', offsetDistance: 8 }"
    >
      <UButton
        color="gray"
        aria-label="Order actions"
      >
        <template #leading>
          <AppIcon
            name="moreHorizontal"
            size="sm"
            class="text-text-strong"
          />
        </template>
      </UButton>
    </UDropdown>

    <p
      v-if="showPermissionNote"
      class="text-sm text-text-subtle"
    >
      Ask a platform administrator for order management access.
    </p>
  </div>
</template>
