<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import DataTable from '@arc/ui/primitives/data-table/data-table.vue'

/**
 * Line-item table for purchased or about-to-be-purchased quantities: the
 * seller Order summary layout, reused by the buyer's Order detail and by the
 * checkout review so the same purchase reads the same way everywhere.
 *
 * Rows carry unit prices only; the amount column is the unit price times the
 * quantity, and no caller re-derives accepted money here.
 */
type OrderItemRow = {
  id: string
  title: string
  imageUrl?: string
  variantLabels: string[]
  quantity: number
  unitPriceMinor: number
  originalUnitPriceMinor?: number | null
  percentOff?: number | null
  currency: string
}

const props = defineProps<{
  rows: OrderItemRow[]
}>()

/**
 * Quantity and unit price collapse into the item cell below `md`, matching the
 * previous stacked layout on small screens.
 */
const columns = [
  { key: 'items', label: 'Items' },
  { key: 'qty', label: 'Qty', class: 'hidden w-16 text-center md:table-cell', rowClass: 'hidden md:table-cell' },
  { key: 'unit', label: 'Unit price', class: 'hidden w-40 text-right md:table-cell', rowClass: 'hidden md:table-cell' },
  { key: 'amount', label: 'Amount', class: 'w-28 text-left md:w-40 md:text-right' },
]

const emptyState = {
  icon: 'i-heroicons-shopping-bag-20-solid',
  label: 'No items.',
}
</script>

<template>
  <DataTable
    class="mt-5"
    by="id"
    :rows="props.rows"
    :columns="columns"
    :selectable="false"
    :empty-state="emptyState"
  >
    <template #items-data="{ row }">
      <div class="flex min-w-0 items-start gap-4">
        <NuxtImg
          v-if="row.imageUrl"
          :src="row.imageUrl"
          width="72"
          height="72"
          class="rounded-xl border border-border-subtle object-cover"
        />
        <div class="min-w-0 space-y-1 whitespace-normal">
          <div class="font-medium text-text-strong">
            {{ row.title }}
          </div>
          <div
            v-for="label in row.variantLabels"
            :key="label"
            class="text-sm text-text-muted"
          >
            {{ label }}
          </div>
          <div class="text-sm text-text-muted md:hidden">
            Unit price: {{ formatMinorCurrency(row.unitPriceMinor, row.currency) }}
          </div>
          <slot
            name="row-actions"
            :row="row"
          />
        </div>
      </div>
    </template>

    <template #qty-data="{ row }">
      <div class="text-center text-sm text-text-muted">
        {{ row.quantity }}
      </div>
    </template>

    <template #unit-data="{ row }">
      <div class="text-right text-text-subtle">
        <div>{{ formatMinorCurrency(row.unitPriceMinor, row.currency) }}</div>
        <div
          v-if="row.originalUnitPriceMinor"
          class="text-sm text-text-muted"
        >
          <span class="line-through">
            {{ formatMinorCurrency(row.originalUnitPriceMinor, row.currency) }}
          </span>
          <span v-if="row.percentOff"> ({{ row.percentOff }}% off)</span>
        </div>
      </div>
    </template>

    <template #amount-data="{ row }">
      <div class="text-left font-medium text-text-strong md:text-right">
        {{ formatMinorCurrency(row.unitPriceMinor * row.quantity, row.currency) }}
      </div>
    </template>
  </DataTable>
</template>
