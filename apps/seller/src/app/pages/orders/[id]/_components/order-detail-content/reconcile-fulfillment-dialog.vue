<script setup lang="ts">
import ShipmentItemQuantities from './shipment-item-quantities.vue'
import { clampShipmentQuantity } from './shipments.presentation'
import { useShopOrderFulfillmentMutations } from '~/domains/shop/mutations/order-fulfillment.mutation'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

const props = defineProps<{
  order: ShopOrder
}>()

const dialog = useModal()
const { reconcileFulfillment } = useShopOrderFulfillmentMutations()

const rows = props.order.products.map(product => ({
  orderItemId: product.id,
  title: product.title,
  hint: `${product.quantity} ordered`,
  max: product.quantity,
}))

const quantities = ref<Record<string, number>>(
  Object.fromEntries(rows.map(row => [row.orderItemId, row.max])),
)

const reconciledItems = computed(() => rows
  .map(row => ({
    order_item_id: row.orderItemId,
    quantity: clampShipmentQuantity(quantities.value[row.orderItemId], row.max),
  }))
  .filter(item => item.quantity > 0))

async function reconcile() {
  await reconcileFulfillment.mutateAsync({
    orderId: props.order.id,
    body: { items: reconciledItems.value },
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
    disabled: reconcileFulfillment.isPending.value,
    run: () => dialog.close(),
  },
  {
    id: 'reconcile',
    label: 'Reconcile fulfillment',
    shortcut: 'meta_enter' as const,
    allowWhileInputFocused: true,
    disabled: reconciledItems.value.length === 0,
    loading: reconcileFulfillment.isPending.value,
    run: reconcile,
  },
])
</script>

<template>
  <BaseDialog
    title="Reconcile fulfillment"
    description="Confirm the quantity of each order item that can still be fulfilled. Shipments cannot be prepared until this matches the order."
    width="w-full sm:max-w-2xl"
    :actions="actions"
  >
    <ShipmentItemQuantities
      v-model="quantities"
      :rows="rows"
    />
  </BaseDialog>
</template>
