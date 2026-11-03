<script setup lang="ts">
import {
  formatShipmentTimestamp,
  shipmentCarrierEventUpdates,
  shipmentStatusLabel,
  shipmentStatusTone,
  shipmentUpdateTitle,
} from './shipments.presentation'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  shipment: ShopOrder['fulfillment']['groups'][number]['shipments'][number]
}>()

const dialog = useModal()

const updates = computed(() => shipmentCarrierEventUpdates(props.shipment))

const actions = computed(() => [
  {
    id: 'close',
    label: 'Close',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    run: () => dialog.close(),
  },
])
</script>

<template>
  <BaseDialog
    title="Tracking events"
    :description="shipment.tracking_number
      ? `Carrier scans for ${shipment.tracking_number}.`
      : 'Carrier scans for this consignment.'"
    width="w-full sm:max-w-lg"
    :actions="actions"
  >
    <ol
      v-if="updates.length"
      class="space-y-3"
    >
      <li
        v-for="update in updates"
        :key="update.id"
        class="rounded-lg border border-border-subtle p-4"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="text-sm font-medium capitalize text-text-strong">
              {{ shipmentUpdateTitle(update) }}
            </div>
            <div
              v-if="update.location"
              class="text-sm text-text-muted"
            >
              {{ update.location }}
            </div>
          </div>

          <StatusBadge
            :color="shipmentStatusTone(update.status)"
            size="sm"
            class="shrink-0 capitalize"
          >
            {{ shipmentStatusLabel(update.status) }}
          </StatusBadge>
        </div>

        <div class="mt-2 text-xs text-text-muted">
          {{ formatShipmentTimestamp(update.occurred_at) }}
        </div>
      </li>
    </ol>

    <p
      v-else
      class="text-sm text-text-muted"
    >
      No carrier events recorded yet.
    </p>
  </BaseDialog>
</template>
