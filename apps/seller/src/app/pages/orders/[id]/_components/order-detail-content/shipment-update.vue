<script lang="ts" setup>
import { useOrderShipmentState } from './use-order-shipment-state'
import type { ShopOrder } from '~/shared/types/shop-order-detail'
import { useShopUpdateOrderShipment } from '~/shared/server-state/shop/order/update-shipment.mutation'

const props = defineProps<{
  order: ShopOrder
}>()

const { mutateAsync: updateShipment, isPending: isUpdatingShipment } = useShopUpdateOrderShipment()
const shipmentForm = reactive({
  tracking_number: '',
  shipping_carrier: '',
  shipment_note: '',
})

const {
  canEditShipmentInfo,
  shipmentUpdatesBlocked,
} = useOrderShipmentState(() => props.order)

watch(() => props.order, (order) => {
  shipmentForm.tracking_number = order.shipping.tracking_number ?? ''
  shipmentForm.shipping_carrier = order.shipping.shipping_carrier ?? ''
  shipmentForm.shipment_note = order.shipping.shipment_note ?? ''
}, { immediate: true })

async function saveShipment() {
  if (shipmentUpdatesBlocked.value) return

  await updateShipment({
    orderId: props.order.id,
    body: {
      tracking_number: shipmentForm.tracking_number || undefined,
      shipping_carrier: shipmentForm.shipping_carrier || undefined,
      shipment_note: shipmentForm.shipment_note || undefined,
    },
  })
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="font-semibold">
        Shipment update
      </div>
    </template>

    <div class="space-y-4">
      <div class="grid gap-4 md:grid-cols-2">
        <UFormGroup label="Tracking number">
          <UInput
            v-model="shipmentForm.tracking_number"
            :disabled="!canEditShipmentInfo"
          />
        </UFormGroup>
        <UFormGroup label="Carrier">
          <UInput
            v-model="shipmentForm.shipping_carrier"
            :disabled="!canEditShipmentInfo"
          />
        </UFormGroup>
      </div>

      <UFormGroup label="Shipment note">
        <UTextarea
          v-model="shipmentForm.shipment_note"
          :rows="4"
          :disabled="!canEditShipmentInfo"
        />
      </UFormGroup>

      <div
        v-if="shipmentUpdatesBlocked"
        class="rounded-md border border-border-subtle bg-surface-subtle p-3 text-sm text-text-muted"
      >
        Shipment updates are unavailable for this order state.
      </div>

      <div class="flex flex-wrap gap-3">
        <UButton
          v-if="canEditShipmentInfo"
          :loading="isUpdatingShipment"
          @click="saveShipment"
        >
          Save shipment info
        </UButton>
      </div>
    </div>
  </UCard>
</template>
