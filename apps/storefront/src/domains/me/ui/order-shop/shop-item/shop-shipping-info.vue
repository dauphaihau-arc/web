<script setup lang="ts">
import { formatShippingEstimateRange } from '@arc/utils'
import { FulfillmentAggregateStatuses, ShipmentStatuses } from '@arc/enums/fulfillment'
import type { ElementType } from '@arc/contracts/utils'
import { useAccountTranslator } from '~/domains/me/ui/account-i18n'
import { useLocaleFormatters } from '~/domains/market/composables/use-locale-formatters'
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

const t = useAccountTranslator()
const { formatDate: formatLocaleDate } = useLocaleFormatters()

const aggregateStatusLabelKey: Record<FulfillmentAggregateStatuses, string> = {
  [FulfillmentAggregateStatuses.UNFULFILLED]: 'account.orders.fulfillment.preparingOrder',
  [FulfillmentAggregateStatuses.PREPARED]: 'account.orders.fulfillment.preparingOrder',
  [FulfillmentAggregateStatuses.PARTIALLY_SHIPPED]: 'account.orders.fulfillment.partiallyShipped',
  [FulfillmentAggregateStatuses.SHIPPED]: 'account.orders.fulfillment.shipped',
  [FulfillmentAggregateStatuses.PARTIALLY_DELIVERED]: 'account.orders.fulfillment.partiallyDelivered',
  [FulfillmentAggregateStatuses.DELIVERED]: 'account.orders.fulfillment.delivered',
  [FulfillmentAggregateStatuses.CANCELED]: 'account.orders.fulfillment.canceled',
  // Legacy order-level projection: no per-quantity facts, so transit reports as shipped.
  [FulfillmentAggregateStatuses.DISPATCHED]: 'account.orders.fulfillment.shipped',
  [FulfillmentAggregateStatuses.IN_TRANSIT]: 'account.orders.fulfillment.shipped',
}

const shipmentStatusLabelKey: Record<ShipmentStatuses, string> = {
  [ShipmentStatuses.PREPARED]: 'account.orders.fulfillment.prepared',
  [ShipmentStatuses.DISPATCHED]: 'account.orders.fulfillment.dispatched',
  [ShipmentStatuses.IN_TRANSIT]: 'account.orders.fulfillment.inTransit',
  [ShipmentStatuses.DELIVERED]: 'account.orders.fulfillment.delivered',
  [ShipmentStatuses.VOIDED]: 'account.orders.fulfillment.voided',
}

function formatDate(value: string | Date | undefined | null): string {
  if (!value) return ''
  return formatLocaleDate(value, { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatShortDate(value: string | Date | undefined | null): string {
  if (!value) return ''
  return formatLocaleDate(value, { month: 'short', day: 'numeric' })
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
  return props.orderShop.products.find(product => product.id === orderItemId)?.title
    ?? t('account.orders.shippingInfo.unknownItem')
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
  const itemWord = count === 1
    ? t('account.orders.shippingInfo.itemWordSingular')
    : t('account.orders.shippingInfo.itemWordPlural')
  const status = t(shipmentStatusLabelKey[shipment.status]).toLowerCase()

  return t('account.orders.shippingInfo.itemSummary', { count, itemWord, status })
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
      {{ t(aggregateStatusLabelKey[fulfillment.status]) }}
    </div>

    <div
      v-if="estimateLabel"
      class="mt-2 text-sm text-text-muted"
    >
      {{ t('account.orders.shippingInfo.estimatedDelivery', { range: estimateLabel }) }}
    </div>

    <div
      v-if="props.display === 'detail' && hasGroups"
      class="mt-4 space-y-6"
    >
      <div class="text-sm font-medium text-text-strong">
        {{ t('account.orders.shippingInfo.shipping') }}
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
          {{ t('account.orders.shippingInfo.shipmentOf', {
            index: shipmentIndex + 1,
            total: visibleShipments.length,
          }) }}
        </div>
        <div class="font-medium">
          {{ t(shipmentStatusLabelKey[shipment.status]) }}
        </div>
        <div v-if="shipment.carrier || shipment.carrier_name">
          {{ t('account.orders.shippingInfo.carrier', { carrier: shipment.carrier_name ?? shipment.carrier }) }}
        </div>
        <div v-if="shipment.tracking_number">
          {{ t('account.orders.shippingInfo.tracking', { tracking: shipment.tracking_number }) }}
          <span
            v-if="shipment.carrier_observable === false"
            class="text-xs text-text-subtle"
          >{{ t('account.orders.shippingInfo.unverified') }}</span>
        </div>
        <div v-if="shipment.shipment_note">
          {{ t('account.orders.shippingInfo.note', { note: shipment.shipment_note }) }}
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
            {{ areShipmentItemsExpanded(shipment.id)
              ? t('account.orders.shippingInfo.hideItems')
              : t('account.orders.shippingInfo.viewItems') }}
          </UButton>
        </div>
        <div v-if="!isCompactCompleteShipment(groupItems, shipment) || areShipmentItemsExpanded(shipment.id)">
          <div class="text-xs uppercase tracking-wider text-text-subtle">
            {{ t('account.orders.shippingInfo.items') }}
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
            {{ t('account.orders.shippingInfo.prepared', { date: formatDate(shipment.prepared_at) }) }}
          </div>
          <div v-if="shipment.dispatched_at">
            {{ t('account.orders.shippingInfo.dispatched', { date: formatDate(shipment.dispatched_at) }) }}
          </div>
          <div v-if="shipment.delivered_at">
            {{ t('account.orders.shippingInfo.delivered', { date: formatDate(shipment.delivered_at) }) }}
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="props.display === 'detail' && hasLegacy"
      class="mt-4 space-y-3 border border-dashed border-border-subtle p-3 text-[15px] text-text-muted"
    >
      <div class="text-xs font-medium uppercase tracking-wider text-text-subtle">
        {{ t('account.orders.shippingInfo.legacyShipping') }}
      </div>
      <div>
        {{ t('account.orders.shippingInfo.status', { status: legacy.status }) }}
      </div>
      <div v-if="legacy.updated_at">
        {{ t('account.orders.shippingInfo.updated', { date: formatDate(legacy.updated_at) }) }}
      </div>
      <div v-if="legacy.estimated_delivery">
        {{ t('account.orders.shippingInfo.estimatedDelivery', { range: formatShortDate(legacy.estimated_delivery) }) }}
      </div>
      <div v-if="legacy.carrier || legacy.tracking_number">
        <div v-if="legacy.carrier">
          {{ t('account.orders.shippingInfo.carrier', { carrier: legacy.carrier }) }}
        </div>
        <div v-if="legacy.tracking_number">
          {{ t('account.orders.shippingInfo.tracking', { tracking: legacy.tracking_number }) }}
        </div>
      </div>
      <div v-if="legacy.note">
        {{ t('account.orders.shippingInfo.note', { note: legacy.note }) }}
      </div>
      <div v-if="legacy.shipped_at">
        {{ t('account.orders.shippingInfo.shipped', { date: formatDate(legacy.shipped_at) }) }}
      </div>
      <div v-if="legacy.delivered_at">
        {{ t('account.orders.shippingInfo.delivered', { date: formatDate(legacy.delivered_at) }) }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
