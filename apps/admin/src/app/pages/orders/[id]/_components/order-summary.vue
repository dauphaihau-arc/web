<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import DataTable from '@arc/ui/patterns/data-table/data-table.vue'
import ProductImage from '@arc/ui/primitives/product-image.vue'
import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract'
import { formatOrderAmount } from '~/domains/orders/utils/order-presentation'

const props = defineProps<{
  order: AdminOrderDetailOrder
}>()

type OrderSummaryRow = {
  id: string
  title: string
  options: string
  sku: string
  imageUrl?: string
  quantity: number
  unitPrice: string
  amount: string
}

const columns = [
  { key: 'items', label: 'Items' },
  { key: 'qty', label: 'Qty', class: 'w-20 text-center' },
  { key: 'unit', label: 'Unit price', class: 'w-40 text-right' },
  { key: 'amount', label: 'Amount', class: 'w-40 text-right' },
]

const emptyState = {
  icon: 'archive',
  label: 'No items in this order.',
}

function selectedOptionsLabel(options: AdminOrderDetailOrder['products'][number]['product']['selected_options']) {
  return options
    .map(option => `${option.option_name}: ${option.value}`)
    .join(' · ')
}

const rows = computed<OrderSummaryRow[]>(() =>
  props.order.products.map(product => ({
    id: product.id,
    title: product.title,
    options: selectedOptionsLabel(product.product.selected_options),
    sku: product.inventory.sku ?? '',
    imageUrl: product.image_url,
    quantity: product.quantity,
    unitPrice: formatOrderAmount(product.amount_minor, product.currency),
    amount: formatOrderAmount(product.amount_minor * product.quantity, product.currency),
  })),
)
</script>

<template>
  <UCard>
    <div class="font-semibold">
      Items
    </div>

    <DataTable
      v-if="rows.length > 0"
      class="mt-5"
      by="id"
      :rows="rows"
      :columns="columns"
      :selectable="false"
      :empty-state="emptyState"
    >
      <template #items-data="{ row }">
        <div class="flex min-w-0 items-start gap-4">
          <ProductImage
            :src="row.imageUrl"
            :alt="row.title"
            size="lg"
            rounded="xl"
            class="shrink-0"
          />
          <div class="min-w-0 space-y-1">
            <div
              class="truncate font-medium text-text-strong"
              :title="row.title"
            >
              {{ row.title }}
            </div>
            <div
              v-if="row.options"
              class="text-sm text-text-muted"
            >
              {{ row.options }}
            </div>
            <div
              v-if="row.sku"
              class="text-sm text-text-muted"
            >
              SKU {{ row.sku }}
            </div>
          </div>
        </div>
      </template>

      <template #qty-data="{ row }">
        <div class="text-center text-sm text-text-muted">
          {{ row.quantity }}
        </div>
      </template>

      <template #unit-data="{ row }">
        <div class="text-right text-text-muted">
          {{ row.unitPrice }}
        </div>
      </template>

      <template #amount-data="{ row }">
        <div class="text-right font-medium text-text-strong">
          {{ row.amount }}
        </div>
      </template>
    </DataTable>

    <Empty
      v-else
      variant="naked"
      :icon="ICON_NAME_BY_ALIAS.orders"
      description="No items in this order."
      container-class="py-10"
    />

  </UCard>
</template>
