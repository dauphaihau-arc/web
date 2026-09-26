<script setup lang="ts">
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
  shipment: ShopOrder['fulfillment']['groups'][number]['shipments'][number]
}>()

const dialog = useModal()
const { voidShipment } = useShopOrderFulfillmentMutations()

const itemRows = computed(() => props.shipment.items.map(item => ({
  id: item.order_item_id,
  title: props.order.products.find(product => product.id === item.order_item_id)?.title
    ?? item.order_item_id,
  quantity: item.quantity,
})))

async function confirmVoid() {
  await voidShipment.mutateAsync({
    orderId: props.order.id,
    shipmentId: props.shipment.id,
  })

  await dialog.close()
}

const actions = computed(() => [
  {
    id: 'keep',
    label: 'Keep shipment',
    variant: 'secondary' as const,
    shortcut: 'escape' as const,
    allowWhileInputFocused: true,
    disabled: voidShipment.isPending.value,
    run: () => dialog.close(),
  },
  {
    id: 'void',
    label: 'Void shipment',
    variant: 'danger' as const,
    loading: voidShipment.isPending.value,
    run: confirmVoid,
  },
])
</script>

<template>
  <BaseDialog
    width="w-full sm:max-w-lg"
    :actions="actions"
  >
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-semibold text-text-strong">
          Void this consignment?
        </h2>
        <p class="mt-1 text-sm text-text-muted">
          Voiding releases its prepared quantities back to the group and cannot be undone.
        </p>
      </div>

      <dl class="grid grid-cols-2 gap-3 rounded-lg border border-border-subtle p-4 text-sm">
        <div>
          <dt class="text-text-muted">
            Carrier
          </dt>
          <dd class="font-medium">
            {{ shipment.carrier || '—' }}
          </dd>
        </div>
        <div>
          <dt class="text-text-muted">
            Tracking number
          </dt>
          <dd class="font-medium">
            {{ shipment.tracking_number || '—' }}
          </dd>
        </div>
        <div class="col-span-2">
          <dt class="text-text-muted">
            Items
          </dt>
          <dd class="space-y-1">
            <div
              v-for="row in itemRows"
              :key="row.id"
              class="flex items-center justify-between gap-4"
            >
              <span class="truncate">{{ row.title }}</span>
              <span class="shrink-0 text-text-muted">Qty {{ row.quantity }}</span>
            </div>
          </dd>
        </div>
      </dl>
    </div>
  </BaseDialog>
</template>
