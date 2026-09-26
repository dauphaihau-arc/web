<script setup lang="ts">
import type { DropdownItem } from '#ui/types'
import type { ShipmentJourneyStatuses } from '@arc/enums/fulfillment'
import EditShipmentDialog from './edit-shipment-dialog.vue'
import VoidShipmentDialog from './void-shipment-dialog.vue'
import { journeyIcon, journeyLabel } from './shipments.presentation'
import { useOrderShipmentState } from './use-order-shipment-state'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
  group: ShopOrder['fulfillment']['groups'][number]
  shipment: ShopOrder['fulfillment']['groups'][number]['shipments'][number]
}>()

const dialog = useModal()
const { updateShipmentJourney } = useShopOrderFulfillmentMutations()

const {
  allowedJourneyTransitions,
  canEditShipmentInfo,
  canVoidShipment,
  canTransitionTo,
} = useOrderShipmentState(() => props.order, () => props.shipment)

/**
 * The next step in the journey is the one-click action; the remaining steps and
 * the consignment upkeep live in the overflow menu.
 */
const primaryTransition = computed(() => allowedJourneyTransitions.value[0])

const menuItems = computed<DropdownItem[][]>(() => {
  const menu: DropdownItem[][] = []

  const laterTransitions = allowedJourneyTransitions.value
    .slice(1)
    .map(transition => ({
      label: journeyLabel(transition),
      icon: journeyIcon(transition),
      click: () => handleJourneyTransition(transition),
    }))

  if (laterTransitions.length) {
    menu.push(laterTransitions)
  }

  const upkeep: DropdownItem[] = []

  if (canEditShipmentInfo.value) {
    upkeep.push({
      label: 'Edit shipment',
      icon: 'i-heroicons-pencil-square-20-solid',
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
      icon: 'i-heroicons-x-circle-20-solid',
      class: 'text-red-600',
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

async function handleJourneyTransition(status: ShipmentJourneyStatuses) {
  if (!canTransitionTo(status)) return
  await updateShipmentJourney.mutateAsync({
    orderId: props.order.id,
    shipmentId: props.shipment.id,
    body: { status },
  })
}
</script>

<template>
  <div class="flex items-center justify-end gap-1">
    <UTooltip
      v-if="primaryTransition"
      :text="journeyLabel(primaryTransition)"
    >
      <UButton
        color="gray"
        variant="soft"
        :icon="journeyIcon(primaryTransition)"
        :aria-label="journeyLabel(primaryTransition)"
        :disabled="updateShipmentJourney.isPending.value"
        :loading="updateShipmentJourney.isPending.value"
        @click="handleJourneyTransition(primaryTransition)"
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
            class="text-text-muted"
          />
          <span>{{ item.label }}</span>
        </div>
      </template>

      <UTooltip text="More actions">
        <UButton
          color="gray"
          variant="ghost"
          aria-label="More actions"
          :disabled="updateShipmentJourney.isPending.value"
        >
          <AppIcon
            name="moreHorizontal"
            size="xs"
          />
        </UButton>
      </UTooltip>
    </UDropdown>
  </div>
</template>
