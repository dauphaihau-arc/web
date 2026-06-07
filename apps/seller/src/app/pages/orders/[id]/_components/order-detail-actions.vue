<script lang="ts" setup>
import { OrderShippingStatuses, OrderStatuses, PaymentTypes } from '@arc/enums/order'
import SellerCancelOrderDialog from '../../_components/seller-cancel-order-dialog.vue'
import SellerRefundOrderDialog from '../../_components/seller-refund-order-dialog.vue'
import { useShopGetOrderDetail } from '~/shared/server-state/shop/order/detail.query'
import { useShopUpdateOrderShipment } from '~/shared/server-state/shop/order/update-shipment.mutation'

const props = defineProps<{
  orderId: string
}>()

const dialog = useModal()
const actionsMenuOpen = ref(false)

const { data } = useShopGetOrderDetail(props.orderId)
const { mutateAsync: updateShipment } = useShopUpdateOrderShipment()
const order = computed(() => data.value?.order)

const canRefund = computed(() =>
  !!order.value
  && order.value.payment.type === PaymentTypes.CARD
  && [undefined, 'failed'].includes(order.value.payment.refund_status)
  && (
    (order.value.status === OrderStatuses.PAID && order.value.shipping.shipping_status !== OrderShippingStatuses.PRE_TRANSIT)
    || order.value.status === OrderStatuses.COMPLETED
  ),
)

const canCancel = computed(() =>
  !!order.value
  && [OrderStatuses.PAID, OrderStatuses.PENDING].includes(order.value.status)
  && order.value.shipping.shipping_status === OrderShippingStatuses.PRE_TRANSIT,
)

const canRetryRefund = computed(() =>
  !!order.value
  && order.value.payment.type === PaymentTypes.CARD
  && order.value.payment.refund_status === 'failed'
  && [OrderStatuses.CANCELED, OrderStatuses.PAID, OrderStatuses.COMPLETED].includes(order.value.status),
)

const shipmentUpdatesBlocked = computed(() =>
  !!order.value
  && [
    OrderStatuses.CANCELED,
    OrderStatuses.REFUNDED,
    OrderStatuses.EXPIRED,
    OrderStatuses.ARCHIVED,
    OrderStatuses.AWAITING_PAYMENT,
  ].includes(order.value.status),
)

const allowedShipmentTransitions = computed(() => {
  if (!order.value || shipmentUpdatesBlocked.value) return []

  switch (order.value.shipping.shipping_status) {
    case OrderShippingStatuses.PRE_TRANSIT:
      return [OrderShippingStatuses.IN_TRANSIT, OrderShippingStatuses.SHIPPED]
    case OrderShippingStatuses.IN_TRANSIT:
      return [OrderShippingStatuses.SHIPPED, OrderShippingStatuses.DELIVERED]
    case OrderShippingStatuses.SHIPPED:
      return [OrderShippingStatuses.DELIVERED]
    case OrderShippingStatuses.DELIVERED:
    default:
      return []
  }
})

function canTransitionTo(status: OrderShippingStatuses) {
  return allowedShipmentTransitions.value.includes(status)
}

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

async function saveShipment(status: OrderShippingStatuses) {
  if (!order.value || !canTransitionTo(status)) return

  await updateShipment({
    orderId: order.value.id,
    body: {
      shipping_status: status,
    },
  })
}

type ActionMenuItem = {
  label: string
  icon: string
  tone?: 'danger'
  onClick: () => void | Promise<void>
}

type ActionMenuGroup = {
  label: string
  items: ActionMenuItem[]
}

async function runMenuAction(handler: () => void | Promise<void>) {
  await handler()
  actionsMenuOpen.value = false
}

const actionMenuGroups = computed<ActionMenuGroup[]>(() => {
  const groups: ActionMenuGroup[] = []
  const shipmentActions: ActionMenuItem[] = []

  if (canTransitionTo(OrderShippingStatuses.IN_TRANSIT)) {
    shipmentActions.push({
      label: 'Mark in transit',
      icon: 'i-heroicons-truck-20-solid',
      onClick: () => saveShipment(OrderShippingStatuses.IN_TRANSIT),
    })
  }

  if (canTransitionTo(OrderShippingStatuses.SHIPPED)) {
    shipmentActions.push({
      label: 'Mark shipped',
      icon: 'i-heroicons-arrow-up-on-square-20-solid',
      onClick: () => saveShipment(OrderShippingStatuses.SHIPPED),
    })
  }

  if (canTransitionTo(OrderShippingStatuses.DELIVERED)) {
    shipmentActions.push({
      label: 'Mark delivered',
      icon: 'i-heroicons-check-circle-20-solid',
      onClick: () => saveShipment(OrderShippingStatuses.DELIVERED),
    })
  }

  if (shipmentActions.length) {
    groups.push({
      label: 'Shipment update',
      items: shipmentActions,
    })
  }

  if (canCancel.value) {
    groups.push({
      label: 'Order actions',
      items: [
        {
          label: 'Cancel order',
          icon: 'i-heroicons-x-circle-20-solid',
          tone: 'danger',
          onClick: () => openCancelDialog(),
        },
      ],
    })
  }

  const paymentActions: ActionMenuItem[] = []

  if (canRefund.value) {
    paymentActions.push({
      label: 'Refund order',
      icon: 'i-heroicons-banknotes-20-solid',
      onClick: () => openRefundDialog(false),
    })
  }
  else if (canRetryRefund.value) {
    paymentActions.push({
      label: 'Retry refund',
      icon: 'i-heroicons-arrow-path-20-solid',
      onClick: () => openRefundDialog(true),
    })
  }

  if (paymentActions.length) {
    groups.push({
      label: 'Payment actions',
      items: paymentActions,
    })
  }

  return groups
})
</script>

<template>
  <div class="flex flex-wrap items-center justify-end gap-3">
    <UButton
      v-if="canRefund"
      color="red"
      variant="soft"
      @click="openRefundDialog(false)"
    >
      Refund order
    </UButton>
    <UButton
      v-else-if="canRetryRefund"
      color="red"
      variant="soft"
      @click="openRefundDialog(true)"
    >
      Retry refund
    </UButton>

    <UPopover
      v-if="actionMenuGroups.length"
      v-model:open="actionsMenuOpen"
      :popper="{ placement: 'bottom-end', offsetDistance: 8 }"
      :ui="{ rounded: 'rounded-[16px]', shadow: 'shadow-none', ring: '', background: 'bg-transparent', base: 'overflow-hidden' }"
    >
      <template #panel>
        <div class="min-w-[18rem] overflow-hidden rounded-[16px] border border-border-subtle bg-surface shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          <div
            v-for="(group, groupIndex) in actionMenuGroups"
            :key="group.label"
            class="px-2 py-2"
            :class="{ 'border-t border-border-subtle': groupIndex > 0 }"
          >
            <div class="px-3 py-2 text-sm font-medium text-text-muted">
              {{ group.label }}
            </div>
            <button
              v-for="item in group.items"
              :key="item.label"
              type="button"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-1 text-left text-base text-text-strong transition-colors hover:bg-surface-muted"
              :class="{ 'text-red-600 hover:bg-surface-accent': item.tone === 'danger' }"
              @click="runMenuAction(item.onClick)"
            >
              <UIcon
                :name="item.icon"
                class="size-5 shrink-0"
                :class="item.tone === 'danger' ? 'text-red-500' : 'text-text-muted'"
              />
              <span
                class="flex-1"
                :class="item.tone === 'danger' ? 'text-red-600' : ''"
              >
                {{ item.label }}
              </span>
            </button>
          </div>
        </div>
      </template>

      <UButton
        color="gray"
        variant="ghost"
        icon="i-heroicons-ellipsis-horizontal-20-solid"
        aria-label="Order actions"
      />
    </UPopover>
  </div>
</template>
