<script setup lang="ts">
import ShipmentItemQuantities from './shipment-item-quantities.vue'
import { clampShipmentQuantity, remainingCapacityByItem } from './shipments.presentation'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
  group: ShopOrder['fulfillment']['groups'][number]
  shipment: ShopOrder['fulfillment']['groups'][number]['shipments'][number]
}>()

const dialog = useModal()
const { amendShipment } = useShopOrderFulfillmentMutations()

const form = reactive({
  carrier: props.shipment.carrier ?? '',
  trackingNumber: props.shipment.tracking_number ?? '',
  note: props.shipment.shipment_note ?? '',
})

const remainingElsewhere = remainingCapacityByItem(props.group, props.shipment.id)
const ownQuantityByOrderItemId = new Map(
  props.shipment.items.map(item => [item.order_item_id, item.quantity]),
)

const rows = props.group.items.map((item) => {
  const ownQuantity = ownQuantityByOrderItemId.get(item.order_item_id) ?? 0
  const max = ownQuantity + Math.max(0, remainingElsewhere.get(item.order_item_id) ?? 0)

  return {
    orderItemId: item.order_item_id,
    title: props.order.products.find(product => product.id === item.order_item_id)?.title
      ?? item.order_item_id,
    hint: `${max} available for this consignment`,
    max,
    ownQuantity,
  }
})

const quantities = ref<Record<string, number>>(
  Object.fromEntries(rows.map(row => [row.orderItemId, row.ownQuantity])),
)

const amendedItems = computed(() => rows
  .map(row => ({
    order_item_id: row.orderItemId,
    quantity: clampShipmentQuantity(quantities.value[row.orderItemId], row.max),
  }))
  .filter(item => item.quantity > 0))

async function amend() {
  await amendShipment.mutateAsync({
    orderId: props.order.id,
    shipmentId: props.shipment.id,
    body: {
      items: amendedItems.value,
      carrier: form.carrier || undefined,
      tracking_number: form.trackingNumber || undefined,
      shipment_note: form.note || undefined,
    },
  })

  await dialog.close()
}

const actions = computed(() => [
  {
    id: 'cancel',
    label: 'Cancel',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: amendShipment.isPending.value,
    run: () => dialog.close(),
  },
  {
    id: 'save',
    label: 'Save shipment',
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    disabled: amendedItems.value.length === 0,
    loading: amendShipment.isPending.value,
    run: amend,
  },
])
</script>

<template>
  <BaseDialog
    title="Edit shipment"
    description="Adjust the consignment while it is still prepared. Capacity left in the group can be added to it."
    width="w-full sm:max-w-2xl"
    :actions="actions"
  >
    <div class="space-y-6">
      <ShipmentItemQuantities
        v-model="quantities"
        :rows="rows"
      />

      <div class="grid gap-4 md:grid-cols-2">
        <UFormGroup label="Carrier">
          <UInput
            v-model="form.carrier"
            placeholder="e.g. USPS"
          />
        </UFormGroup>
        <UFormGroup label="Tracking number">
          <UInput v-model="form.trackingNumber" />
        </UFormGroup>
      </div>

      <UFormGroup label="Shipment note">
        <UTextarea
          v-model="form.note"
          :rows="3"
        />
      </UFormGroup>
    </div>
  </BaseDialog>
</template>
