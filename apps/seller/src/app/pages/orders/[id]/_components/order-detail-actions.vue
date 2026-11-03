<script lang="ts" setup>
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import SellerCancelOrderDialog from '../../_components/seller-cancel-order-dialog.vue'
import SellerRefundOrderDialog from '../../_components/seller-refund-order-dialog.vue'
import { useOrderActions } from '~/app/pages/orders/[id]/_components/order-detail-content/use-order-actions'
import { useShopGetOrderDetail } from '~/domains/shop/queries/order/detail.query'

const props = defineProps<{
  orderId: string
}>()

const dialog = useModal()

const { data } = useShopGetOrderDetail(props.orderId)
const order = computed(() => data.value?.order)
const { canRefund, canCancel, canRetryRefund } = useOrderActions(order)

function openRefundDialog(isRetry = false) {
  if (!order.value) return

  dialog.open(SellerRefundOrderDialog, {
    orderId: order.value.id,
    isRetry,
  })
}

function openCancelDialog() {
  if (!order.value) return

  dialog.open(SellerCancelOrderDialog, {
    orderId: order.value.id,
  })
}

type ActionMenuItem = {
  label: string
  icon: string
  tone?: 'danger'
  onClick: () => void | Promise<void>
}

const actionMenuGroups = computed<ActionMenuItem[][]>(() => {
  const groups: ActionMenuItem[][] = []

  if (canCancel.value) {
    groups.push([
      {
        label: 'Cancel order',
        icon: 'lucide:circle-x',
        tone: 'danger',
        onClick: () => openCancelDialog(),
      },
    ])
  }

  const paymentActions: ActionMenuItem[] = []

  if (canRefund.value) {
    paymentActions.push({
      label: 'Refund order',
      icon: 'lucide:banknote',
      onClick: () => openRefundDialog(false),
    })
  }
  else if (canRetryRefund.value) {
    paymentActions.push({
      label: 'Retry refund',
      icon: 'lucide:rotate-cw',
      onClick: () => openRefundDialog(true),
    })
  }

  if (paymentActions.length) {
    groups.push(paymentActions)
  }

  return groups
})

const dropdownItems = computed(() => actionMenuGroups.value.map(group => group.map(item => ({
  label: item.label,
  icon: item.icon,
  class: item.tone === 'danger' ? 'text-red-600' : undefined,
  iconClass: item.tone === 'danger' ? 'text-red-500' : undefined,
  click: () => item.onClick(),
}))))
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-3">
    <UButton
      v-if="canRefund"
      color="red"
      @click="openRefundDialog(false)"
    >
      Refund order
    </UButton>
    <UButton
      v-else-if="canRetryRefund"
      color="red"
      @click="openRefundDialog(true)"
    >
      Retry refund
    </UButton>

    <UDropdown
      v-if="dropdownItems.length"
      :items="dropdownItems"
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
  </div>
</template>
