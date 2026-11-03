<script setup lang="ts">
import type { DropdownItem } from '#ui/types'
import EditShipmentDialog from './edit-shipment-dialog.vue'
import ShipmentEventsDialog from './shipment-events-dialog.vue'
import VoidShipmentDialog from './void-shipment-dialog.vue'
import { shipmentCarrierEventUpdates } from './shipments.presentation'
import { useOrderShipmentState } from './use-order-shipment-state'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import { resolveMyShopId } from '~/domains/shop/utils/resolve-my-shop-id'
import { shopOrderApi } from '~/domains/shop/api/order/order.api'
import { toastCustom } from '~/shared/config/toast'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
  group: ShopOrder['fulfillment']['groups'][number]
  shipment: ShopOrder['fulfillment']['groups'][number]['shipments'][number]
}>()

const dialog = useModal()
const toast = useToast()
const queryClient = useQueryClient()
const { declareShipmentHandover, refundLabel } = useShopOrderFulfillmentMutations()

const {
  canDeclareHandover,
  canEditShipmentInfo,
  canVoidShipment,
  canPrintShipmentLabel,
  canRefundShipmentLabel,
} = useOrderShipmentState(() => props.order, () => props.shipment)

/** Declaring the parcel left the shop is the one-click action, once. */
const menuItems = computed<DropdownItem[][]>(() => {
  const menu: DropdownItem[][] = []

  const upkeep: DropdownItem[] = []

  if (canPrintShipmentLabel.value) {
    upkeep.push({
      label: 'Print label',
      icon: 'lucide:printer',
      click: printLabel,
    })
  }

  if (canRefundShipmentLabel.value) {
    upkeep.push({
      label: 'Refund label',
      icon: 'lucide:rotate-ccw',
      labelClass: 'text-red-600',
      iconClass: 'text-red-500',
      disabled: refundLabel.isPending.value,
      click: handleRefundLabel,
    })
  }

  if (shipmentCarrierEventUpdates(props.shipment).length) {
    upkeep.push({
      label: 'View tracking events',
      icon: 'lucide:history',
      click: () => dialog.open(ShipmentEventsDialog, {
        shipment: props.shipment,
      }),
    })
  }

  if (canEditShipmentInfo.value) {
    upkeep.push({
      label: 'Edit shipment',
      icon: 'lucide:square-pen',
      click: () => dialog.open(EditShipmentDialog, {
        order: props.order,
        group: props.group,
        shipment: props.shipment,
      }),
    })
  }

  if (canVoidShipment.value) {
    upkeep.push({
      label: 'Void shipment',
      icon: 'lucide:circle-x',
      labelClass: 'text-red-600',
      iconClass: 'text-red-500',
      click: () => dialog.open(VoidShipmentDialog, {
        order: props.order,
        shipment: props.shipment,
      }),
    })
  }

  if (upkeep.length) {
    menu.push(upkeep)
  }

  return menu
})

async function handleHandover() {
  if (!canDeclareHandover.value) return
  await declareShipmentHandover.mutateAsync({
    orderId: props.order.id,
    shipmentId: props.shipment.id,
  })
}

/**
 * Refunding voids the label and its Shipment server-side; the order refetch is
 * what removes the row's actions afterwards.
 */
async function handleRefundLabel() {
  if (!canRefundShipmentLabel.value || refundLabel.isPending.value) return
  await refundLabel.mutateAsync({
    orderId: props.order.id,
    shipmentId: props.shipment.id,
  })
}

/**
 * The label PDF lives behind the same authenticated API as the order. It is
 * downloaded as a blob and handed to the browser through an object URL, the
 * same way order exports are saved.
 */
async function printLabel() {
  if (!props.shipment.label) return

  try {
    const shopId = await resolveMyShopId(queryClient)
    const blob = await shopOrderApi.downloadLabel(shopId, props.order.id, props.shipment.id)
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${props.shipment.label.public_id}.pdf`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }
  catch {
    toast.add({
      ...toastCustom.error,
      title: 'Failed to download label',
    })
  }
}
</script>

<template>
  <div class="flex items-center justify-end gap-1">
    <UTooltip
      v-if="canDeclareHandover"
      text="Mark as handed over"
    >
      <UButton
        color="gray"
        variant="soft"
        icon="lucide:package-check"
        aria-label="Mark as handed over"
        :disabled="declareShipmentHandover.isPending.value"
        :loading="declareShipmentHandover.isPending.value"
        @click="handleHandover"
      />
    </UTooltip>

    <UDropdown
      v-if="menuItems.length"
      :items="menuItems"
      :popper="{ placement: 'bottom-end' }"
    >
      <template #item="{ item }">
        <div class="flex w-full items-center gap-2">
          <AppIcon
            v-if="item.icon"
            :name="item.icon"
            size="xs"
            :class="item.iconClass ?? 'text-text-muted'"
          />
          <span :class="item.labelClass">{{ item.label }}</span>
        </div>
      </template>

      <UTooltip text="More actions">
        <UButton
          color="gray"
          variant="soft"
          icon="lucide:ellipsis"
          aria-label="More actions"
          :disabled="declareShipmentHandover.isPending.value || refundLabel.isPending.value"
        />
      </UTooltip>
    </UDropdown>
  </div>
</template>
