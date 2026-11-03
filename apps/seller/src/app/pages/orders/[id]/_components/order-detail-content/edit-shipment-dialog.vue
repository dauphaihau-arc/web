<script setup lang="ts">
import ShipmentItemQuantities from './shipment-item-quantities.vue'
import {
  carrierOptions,
  carrierTrackingError,
  carrierTrackingHint,
  findCarrier,
} from './carriers.presentation'
import { clampShipmentQuantity, remainingCapacityByItem } from './shipments.presentation'
import { ShipmentStatuses } from '@arc/enums/fulfillment'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import { useCarriers } from '~/domains/shop/queries/carriers.query'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
  group: ShopOrder['fulfillment']['groups'][number]
  shipment: ShopOrder['fulfillment']['groups'][number]['shipments'][number]
}>()

const dialog = useModal()
const { amendShipment } = useShopOrderFulfillmentMutations()
const { data: catalogue } = useCarriers()

const form = reactive({
  carrier: props.shipment.carrier ?? '',
  trackingNumber: props.shipment.tracking_number ?? '',
  note: props.shipment.shipment_note ?? '',
})

const carriers = computed(() => catalogue.value?.carriers ?? [])
const carrierSelectOptions = computed(() => carrierOptions(carriers.value))

// Changing the carrier invalidates a previously entered number; the initial
// preselected carrier must keep the shipment's tracking number intact.
watch(() => form.carrier, () => {
  form.trackingNumber = ''
})

const selectedCarrier = computed(() => findCarrier(carriers.value, form.carrier))
const trackingHint = computed(() => carrierTrackingHint(selectedCarrier.value))
const trackingError = computed(() => carrierTrackingError(selectedCarrier.value, form.trackingNumber))
const carrierDescription = computed(() =>
  carrierSelectOptions.value.length === 0
    ? 'Carrier list is unavailable right now. Reload the page to choose one.'
    : '',
)

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

// After handover the parcel is with the carrier: only carrier and tracking stay
// editable until the scan closes the window.
const canChangeItems = computed(() => props.shipment.status === ShipmentStatuses.PREPARED)

const amendedItems = computed(() => rows
  .map(row => ({
    order_item_id: row.orderItemId,
    quantity: clampShipmentQuantity(quantities.value[row.orderItemId], row.max),
  }))
  .filter(item => item.quantity > 0))

async function amend() {
  if (trackingError.value) return

  await amendShipment.mutateAsync({
    orderId: props.order.id,
    shipmentId: props.shipment.id,
    body: {
      ...(canChangeItems.value ? { items: amendedItems.value } : {}),
      carrier: form.carrier || undefined,
      tracking_number: form.trackingNumber.trim() || undefined,
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
    disabled: (canChangeItems.value && amendedItems.value.length === 0) || Boolean(trackingError.value),
    loading: amendShipment.isPending.value,
    run: amend,
  },
])
</script>

<template>
  <BaseDialog
    title="Edit shipment"
    description="Adjust the consignment while it is still prepared. Capacity left in the group can be added to it."
    width="w-full sm:max-w-lg"
    :actions="actions"
  >
    <div class="space-y-6">
      <ShipmentItemQuantities
        v-if="canChangeItems"
        v-model="quantities"
        :rows="rows"
      />

      <p
        v-else
        class="text-sm text-text-muted"
      >
        This consignment is already with the carrier, so only its carrier and
        tracking number can change.
      </p>

      <div class="space-y-4">
        <UFormGroup
          data-testid="shipment-carrier-field"
          label="Carrier"
          :description="carrierDescription"
        >
          <USelectMenu
            v-model="form.carrier"
            data-testid="shipment-carrier-select"
            :options="carrierSelectOptions"
            :disabled="carrierSelectOptions.length === 0"
            value-attribute="value"
            name-attribute="label"
            placeholder="Select a carrier"
            searchable
          />
        </UFormGroup>
        <UFormGroup
          data-testid="shipment-tracking-number-field"
          label="Tracking number"
          :description="trackingHint"
          :error="trackingError"
        >
          <UInput
            v-model="form.trackingNumber"
            data-testid="shipment-tracking-number"
          />
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
