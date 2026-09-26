<script setup lang="ts">
import dayjs from 'dayjs'
import { formatShippingEstimateRange } from '@arc/utils'
import { FulfillmentAggregateStatuses, ShipmentStatuses } from '@arc/enums/fulfillment'
import type { ElementType } from '@arc/contracts/utils'
import type {
  FulfillmentGroup,
  FulfillmentShipment,
  GetOrderShopsResponse,
} from '~/domains/me/api/order/contracts/order.contract'

const props = withDefaults(defineProps<{
  orderShop: ElementType<GetOrderShopsResponse['order_shops']>
  display?: 'summary' | 'detail'
}>(), {
  display: 'summary',
})

const aggregateStatusLabel: Record<FulfillmentAggregateStatuses, string> = {
  [FulfillmentAggregateStatuses.UNFULFILLED]: 'Preparing order',
  [FulfillmentAggregateStatuses.PREPARED]: 'Preparing order',
  [FulfillmentAggregateStatuses.PARTIALLY_SHIPPED]: 'Partially shipped',
  [FulfillmentAggregateStatuses.SHIPPED]: 'Shipped',
  [FulfillmentAggregateStatuses.PARTIALLY_DELIVERED]: 'Partially delivered',
  [FulfillmentAggregateStatuses.DELIVERED]: 'Delivered',
  [FulfillmentAggregateStatuses.CANCELED]: 'Canceled',
  // Legacy order-level projection: no per-quantity facts, so transit reports as shipped.
  [FulfillmentAggregateStatuses.DISPATCHED]: 'Shipped',
  [FulfillmentAggregateStatuses.IN_TRANSIT]: 'Shipped',
}

/**
 * Buyer-safe summary line. It is rendered from the server-provided aggregate
 * status only, never from prepared capacity or derived delivery dates.
 */
const aggregateStatusSecondary: Record<FulfillmentAggregateStatuses, string> = {
  [FulfillmentAggregateStatuses.UNFULFILLED]: 'We are preparing your order',
  [FulfillmentAggregateStatuses.PREPARED]: 'We are preparing your order',
  [FulfillmentAggregateStatuses.PARTIALLY_SHIPPED]: 'Some items are on the way',
  [FulfillmentAggregateStatuses.SHIPPED]: 'All items are on the way',
  [FulfillmentAggregateStatuses.PARTIALLY_DELIVERED]: 'Some items have arrived',
  [FulfillmentAggregateStatuses.DELIVERED]: 'Everything has arrived',
  [FulfillmentAggregateStatuses.CANCELED]: 'This order was canceled',
  [FulfillmentAggregateStatuses.DISPATCHED]: 'All items are on the way',
  [FulfillmentAggregateStatuses.IN_TRANSIT]: 'All items are on the way',
}

const shipmentStatusLabel: Record<ShipmentStatuses, string> = {
  [ShipmentStatuses.PREPARED]: 'Prepared',
  [ShipmentStatuses.DISPATCHED]: 'Dispatched',
  [ShipmentStatuses.IN_TRANSIT]: 'In transit',
  [ShipmentStatuses.DELIVERED]: 'Delivered',
  [ShipmentStatuses.VOIDED]: 'Voided',
}

function formatDate(value: string | Date | undefined | null): string {
  if (!value) return ''
  return dayjs(value).isValid() ? dayjs(value).format('MMM DD, YYYY') : ''
}

function formatShortDate(value: string | Date | undefined | null): string {
  if (!value) return ''
  return dayjs(value).isValid() ? dayjs(value).format('MMM DD') : ''
}

const fulfillment = computed(() => props.orderShop.fulfillment)
const hasGroups = computed(() => fulfillment.value.groups.length > 0)
const legacy = computed(() => fulfillment.value.legacy_shipping)

/**
 * Accepted seller estimate snapshotted at purchase. It is server-computed and
 * never recalculated from current Product or Shipping Profile configuration.
 */
const estimateLabel = computed(
  () => formatShippingEstimateRange(props.orderShop.shipping?.estimate),
)

const hasLegacy = computed(() => {
  if (!legacy.value || hasGroups.value) {
    return false
  }
  return Boolean(
    legacy.value.tracking_number
    || legacy.value.carrier
    || legacy.value.note
    || legacy.value.shipped_at
    || legacy.value.delivered_at,
  )
})

function productTitleForItem(orderItemId: string): string {
  return props.orderShop.products.find(product => product.id === orderItemId)?.title ?? 'Unknown item'
}

const expandedShipmentItems = ref<string | null>(null)

function shipmentCoversGroup(
  group: Pick<FulfillmentGroup, 'items'>,
  shipment: FulfillmentShipment,
): boolean {
  if (group.items.length !== shipment.items.length) return false

  const shipmentQuantityByOrderItemId = new Map(
    shipment.items.map(item => [item.order_item_id, item.quantity]),
  )

  return group.items.every(item => shipmentQuantityByOrderItemId.get(item.order_item_id) === item.quantity)
}

function shipmentItemCount(shipment: FulfillmentShipment): number {
  return shipment.items.reduce((count, item) => count + item.quantity, 0)
}

function shipmentItemSummary(shipment: FulfillmentShipment): string {
  const count = shipmentItemCount(shipment)
  const itemLabel = count === 1 ? 'item' : 'items'
  return `${count} ${itemLabel} ${shipmentStatusLabel[shipment.status].toLowerCase()}`
}

function isCompactCompleteShipment(
  groupItems: FulfillmentGroup['items'],
  shipment: FulfillmentShipment,
): boolean {
  return visibleShipments.value.length === 1
    && shipmentCoversGroup({ items: groupItems }, shipment)
}

function toggleShipmentItems(shipmentId: string): void {
  expandedShipmentItems.value = expandedShipmentItems.value === shipmentId
    ? null
    : shipmentId
}

function areShipmentItemsExpanded(shipmentId: string): boolean {
  return expandedShipmentItems.value === shipmentId
}

/**
 * Buyer-facing Shipment projection. Fulfillment Groups are internal allocation
 * structure, so their method, operator, source, and ordering are not rendered.
 */
const visibleShipments = computed(() => fulfillment.value.groups.flatMap(group =>
  group.shipments
    .filter(shipment => shipment.status !== ShipmentStatuses.VOIDED)
    .map(shipment => ({
      shipment,
      groupItems: group.items,
    }),
    )))
</script>

<template>
  <div>
    <div class="text-2xl font-medium">
      {{ aggregateStatusLabel[fulfillment.status] }}
    </div>
    <div class="text-text-muted">
      {{ aggregateStatusSecondary[fulfillment.status] }}
    </div>

    <div
      v-if="estimateLabel"
      class="mt-2 text-sm text-text-muted"
    >
      Estimated delivery: {{ estimateLabel }}
    </div>

    <div
      v-if="props.display === 'detail' && hasGroups"
      class="mt-4 space-y-6"
    >
      <div class="text-sm font-medium text-text-strong">
        Shipping
      </div>

      <div
        v-for="({ shipment, groupItems }, shipmentIndex) in visibleShipments"
        :key="shipment.id"
        class="mt-3 space-y-1 border-l-2 border-border-subtle pl-3 text-[15px] text-text-muted"
      >
        <div
          v-if="visibleShipments.length > 1"
          class="text-xs font-medium text-text-strong"
        >
          Shipment {{ shipmentIndex + 1 }} of {{ visibleShipments.length }}
        </div>
        <div class="font-medium">
          {{ shipmentStatusLabel[shipment.status] }}
        </div>
        <div v-if="shipment.carrier">
          Carrier: {{ shipment.carrier }}
        </div>
        <div v-if="shipment.tracking_number">
          Tracking: {{ shipment.tracking_number }}
        </div>
        <div v-if="shipment.shipment_note">
          Note: {{ shipment.shipment_note }}
        </div>
        <div
          v-if="isCompactCompleteShipment(groupItems, shipment)"
          class="flex items-center justify-between gap-3"
        >
          <span>{{ shipmentItemSummary(shipment) }}</span>
          <UButton
            color="gray"
            size="xs"
            variant="ghost"
            @click="toggleShipmentItems(shipment.id)"
          >
            {{ areShipmentItemsExpanded(shipment.id) ? 'Hide items' : 'View items' }}
          </UButton>
        </div>
        <div v-if="!isCompactCompleteShipment(groupItems, shipment) || areShipmentItemsExpanded(shipment.id)">
          <div class="text-xs uppercase tracking-wider text-text-subtle">
            Items
          </div>
          <ul class="list-inside list-disc">
            <li
              v-for="item in shipment.items"
              :key="item.order_item_id"
            >
              {{ item.quantity }} × {{ productTitleForItem(item.order_item_id) }}
            </li>
          </ul>
        </div>
        <div class="space-y-0.5 text-xs">
          <div v-if="shipment.prepared_at">
            Prepared {{ formatDate(shipment.prepared_at) }}
          </div>
          <div v-if="shipment.dispatched_at">
            Dispatched {{ formatDate(shipment.dispatched_at) }}
          </div>
          <div v-if="shipment.delivered_at">
            Delivered {{ formatDate(shipment.delivered_at) }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="props.display === 'detail' && hasLegacy"
      class="mt-4 space-y-3 border border-dashed border-border-subtle p-3 text-[15px] text-text-muted"
    >
      <div class="text-xs font-medium uppercase tracking-wider text-text-subtle">
        Legacy shipping
      </div>
      <div>
        Status: {{ legacy.status }}
      </div>
      <div v-if="legacy.updated_at">
        Updated {{ formatDate(legacy.updated_at) }}
      </div>
      <div v-if="legacy.estimated_delivery">
        Estimated delivery: {{ formatShortDate(legacy.estimated_delivery) }}
      </div>
      <div v-if="legacy.carrier || legacy.tracking_number">
        <div v-if="legacy.carrier">
          Carrier: {{ legacy.carrier }}
        </div>
        <div v-if="legacy.tracking_number">
          Tracking: {{ legacy.tracking_number }}
        </div>
      </div>
      <div v-if="legacy.note">
        Note: {{ legacy.note }}
      </div>
      <div v-if="legacy.shipped_at">
        Shipped {{ formatDate(legacy.shipped_at) }}
      </div>
      <div v-if="legacy.delivered_at">
        Delivered {{ formatDate(legacy.delivered_at) }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
