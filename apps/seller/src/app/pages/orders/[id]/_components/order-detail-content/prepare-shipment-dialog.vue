<script setup lang="ts">
import ShipmentItemQuantities from './shipment-item-quantities.vue'
import {
  clampShipmentQuantity,
  remainingCapacityByItem,
  remainingCapacityTotal,
} from './shipments.presentation'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
  group: ShopOrder['fulfillment']['groups'][number]
}>()

const dialog = useModal()
const { prepareShipment } = useShopOrderFulfillmentMutations()

const form = reactive({
  carrier: '',
  trackingNumber: '',
  note: '',
})

const remaining = remainingCapacityByItem(props.group)
const totalRemaining = remainingCapacityTotal(props.group)

const rows = props.group.items.map((item) => {
  const max = Math.max(0, remaining.get(item.order_item_id) ?? 0)

  return {
    orderItemId: item.order_item_id,
    title: props.order.products.find(product => product.id === item.order_item_id)?.title
      ?? item.order_item_id,
    hint: `${max} remaining`,
    max,
  }
})

const quantities = ref<Record<string, number>>(
  Object.fromEntries(rows.map(row => [row.orderItemId, row.max])),
)

const selectedItems = computed(() => rows
  .map(row => ({
    order_item_id: row.orderItemId,
    quantity: clampShipmentQuantity(quantities.value[row.orderItemId], row.max),
  }))
  .filter(item => item.quantity > 0))

async function prepare() {
  if (selectedItems.value.length === 0) return

  await prepareShipment.mutateAsync({
    orderId: props.order.id,
    body: {
      group_id: props.group.id,
      items: selectedItems.value,
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
    disabled: prepareShipment.isPending.value,
    run: () => dialog.close(),
  },
  {
    id: 'prepare',
    label: 'Prepare shipment',
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    disabled: selectedItems.value.length === 0,
    loading: prepareShipment.isPending.value,
    run: prepare,
  },
])
</script>

<template>
  <BaseDialog
    title="Prepare shipment"
    description="Select the quantities for this consignment. Preparing does not dispatch it, and only the remaining unassigned quantity can be prepared."
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
          :rows="2"
        />
      </UFormGroup>

      <p class="text-xs text-text-muted">
        {{ totalRemaining }} unit{{ totalRemaining === 1 ? '' : 's' }} remaining to prepare in this group.
      </p>
    </div>
  </BaseDialog>
</template>
