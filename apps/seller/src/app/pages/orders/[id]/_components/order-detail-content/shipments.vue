<script setup lang="ts">
import PrepareShipmentDialog from './prepare-shipment-dialog.vue'
import ReconcileFulfillmentDialog from './reconcile-fulfillment-dialog.vue'
import ShipmentRowActions from './shipment-row-actions.vue'
import {
  activeShipments,
  formatShipmentDate,
  remainingCapacityTotal,
  shipmentStatusTimestamp,
  shipmentStatusTone,
} from './shipments.presentation'
import { useOrderShipmentState } from './use-order-shipment-state'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'

const props = defineProps<{
  order: ShopOrder
}>()

type FulfillmentGroup = ShopOrder['fulfillment']['groups'][number]
type Shipment = FulfillmentGroup['shipments'][number]

type ShipmentTableRow = {
  id: string
  carrier: string
  tracking: string
  items: string
  shipment: Shipment
}

const columns = [
  { key: 'status', label: 'Status' },
  { key: 'carrier', label: 'Carrier', class: 'w-40' },
  { key: 'tracking', label: 'Tracking', class: 'w-48' },
  { key: 'items', label: 'Items', class: 'w-48' },
  { key: 'actions', label: 'Actions', class: 'w-28' },
]

const emptyState = {
  icon: 'i-heroicons-cube-20-solid',
  label: 'No consignments prepared yet.',
}

const dialog = useModal()

const needsReconciliation = computed(() => props.order.fulfillment.requires_reconciliation)
const { shipmentUpdatesBlocked } = useOrderShipmentState(
  () => props.order,
  () => undefined,
)

const productById = computed(() => new Map(
  props.order.products.map(product => [product.id, product]),
))

function shipmentRows(group: FulfillmentGroup): ShipmentTableRow[] {
  return activeShipments(group).map(shipment => ({
    id: shipment.id,
    carrier: shipment.carrier || '—',
    tracking: shipment.tracking_number || '—',
    items: shipment.items
      .map(item => `${productById.value.get(item.order_item_id)?.title ?? item.order_item_id} ×${item.quantity}`)
      .join(', '),
    shipment,
  }))
}

const groups = computed(() => props.order.fulfillment.groups.map((group, index) => {
  const { progress } = group
  const remaining = remainingCapacityTotal(group)

  return {
    id: group.id,
    group,
    label: `Fulfillment group ${index + 1} — ${group.method} / ${group.operator}`,
    progressLabel: `Ordered ${progress.ordered} · Prepared ${progress.prepared} · Dispatched ${progress.dispatched} · Delivered ${progress.delivered}`,
    remaining,
    canPrepare: !shipmentUpdatesBlocked.value && remaining > 0,
    rows: shipmentRows(group),
  }
}))

function openPrepareDialog(group: FulfillmentGroup) {
  dialog.open(PrepareShipmentDialog, { order: props.order, group })
}

function openReconcileDialog() {
  dialog.open(ReconcileFulfillmentDialog, { order: props.order })
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="font-semibold">
        Shipments
      </div>
    </template>

    <div class="space-y-6">
      <div
        v-if="needsReconciliation"
        class="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border-subtle bg-surface-subtle p-4"
      >
        <p class="text-sm text-text-muted">
          This order requires fulfillment reconciliation before shipments can be prepared.
        </p>
        <UButton
          size="xs"
          @click="openReconcileDialog"
        >
          Reconcile fulfillment
        </UButton>
      </div>

      <div
        v-for="entry in groups"
        :key="entry.id"
        class="space-y-3"
      >
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div class="space-y-1">
            <div class="text-sm font-medium text-text-strong">
              {{ entry.label }}
            </div>
            <div class="text-xs text-text-muted">
              {{ entry.progressLabel }}
            </div>
          </div>

          <div
            v-if="entry.canPrepare"
            class="flex items-center gap-3"
          >
            <span class="text-xs text-text-muted">
              {{ entry.remaining }} unit{{ entry.remaining === 1 ? '' : 's' }} remaining to prepare
            </span>
            <UButton
              size="xs"
              @click="openPrepareDialog(entry.group)"
            >
              Prepare shipment
            </UButton>
          </div>
        </div>

        <DataTable
          by="id"
          :rows="entry.rows"
          :columns="columns"
          :selectable="false"
          :empty-state="emptyState"
        >
          <template #status-data="{ row }">
            <div class="space-y-1">
              <StatusBadge
                :color="shipmentStatusTone(row.shipment.status)"
                class="capitalize"
              >
                {{ row.shipment.status.replaceAll('_', ' ') }}
              </StatusBadge>
              <div class="text-xs text-text-muted">
                {{ formatShipmentDate(shipmentStatusTimestamp(row.shipment)) }}
              </div>
              <div
                v-if="row.shipment.origin_countries.length"
                class="text-xs text-text-muted"
              >
                From: {{ row.shipment.origin_countries.join(', ') }}
              </div>
            </div>
          </template>

          <template #carrier-data="{ row }">
            <div class="truncate text-text-muted">
              {{ row.carrier }}
            </div>
          </template>

          <template #tracking-data="{ row }">
            <div
              class="truncate text-text-muted"
              :title="row.tracking"
            >
              {{ row.tracking }}
            </div>
          </template>

          <template #items-data="{ row }">
            <div
              class="truncate text-text-strong"
              :title="row.items"
            >
              {{ row.items }}
            </div>
          </template>

          <template #actions-data="{ row }">
            <ShipmentRowActions
              :order="order"
              :group="entry.group"
              :shipment="row.shipment"
            />
          </template>
        </DataTable>
      </div>

      <div
        v-if="order.fulfillment.groups.length === 0"
        class="text-sm text-text-muted"
      >
        No fulfillment groups.
      </div>
    </div>
  </UCard>
</template>
