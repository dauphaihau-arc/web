<script setup lang="ts">
import { computed } from 'vue'
import { PRODUCT_CONFIG } from '@arc/enums/product'
import type { VariantInputColumn, VariantInputTableRow } from './variant-input.types'

const props = defineProps<{
  columns: VariantInputColumn[]
  currency?: string
  rows: VariantInputTableRow[]
  uppercaseSku?: boolean
}>()

defineEmits<{
  rowInput: [event: Event, row: VariantInputTableRow]
}>()

const INVENTORY_COLUMN_WIDTHS: Partial<Record<VariantInputColumn['key'], string>> = {
  amount: 'w-44 min-w-44',
  stock: 'w-32 min-w-32',
  sku: 'w-[23rem] min-w-[23rem]',
}

const inventoryColumns = computed(() =>
  props.columns.map(column => ({
    ...column,
    class: [column.class, INVENTORY_COLUMN_WIDTHS[column.key]].filter(Boolean).join(' ') || undefined,
  })),
)
</script>

<template>
  <UTable
    :rows="rows"
    :columns="inventoryColumns"
    class="mt-5"
    :ui="{
      th: { base: 'truncate' },
      td: { base: 'py-4 align-top' },
    }"
  >
    <template #variant_name-data="{ row }">
      <div class="min-w-44 max-w-44 truncate px-2">
        {{ row.variant_name || '-' }}
      </div>
    </template>

    <template #sub_variant_name-data="{ row }">
      <div class="min-w-44 max-w-44 truncate px-2">
        {{ row.sub_variant_name || '-' }}
      </div>
    </template>

    <template #amount-data="{ row }">
      <UFormGroup
        :error="row.errorAmount ?? ''"
      >
        <UInput
          v-model.number="row.amount"
          v-max-number="PRODUCT_CONFIG.MAX_PRICE"
          v-numeric
          size="lg"
          name="amount"
          @input="(event: Event) => $emit('rowInput', event, row)"
        >
          <template #trailing>
            <span class="text-xs text-text-muted">{{ currency ?? 'USD' }}</span>
          </template>
        </UInput>
        <template #error="{ error }">
          <p class="error-message">
            {{ error ?? '' }}
          </p>
        </template>
      </UFormGroup>
    </template>

    <template #stock-data="{ row }">
      <UFormGroup
        :error="row.errorStock ?? ''"
      >
        <UInput
          v-model.number="row.stock"
          v-max-number="PRODUCT_CONFIG.MAX_STOCK"
          v-numeric
          name="stock"
          size="lg"
          @input="(event: Event) => $emit('rowInput', event, row)"
        />
        <template #error="{ error }">
          <p class="error-message">
            {{ error ?? '' }}
          </p>
        </template>
      </UFormGroup>
    </template>

    <template #sku-data="{ row }">
      <UFormGroup
        :error="row.errorSku ?? ''"
      >
        <UInput
          v-if="uppercaseSku"
          v-model="row.sku"
          v-sku
          v-uppercase
          :maxlength="PRODUCT_CONFIG.MAX_CHAR_SKU"
          name="sku"
          :color="row.errorSku ? 'red' : undefined"
          size="lg"
          @input="(event: Event) => $emit('rowInput', event, row)"
        />
        <UInput
          v-else
          v-model="row.sku"
          v-sku
          :maxlength="PRODUCT_CONFIG.MAX_CHAR_SKU"
          name="sku"
          size="lg"
          :color="row.errorSku ? 'red' : undefined"
          :ui="{ base: 'uppercase' }"
          @input="(event: Event) => $emit('rowInput', event, row)"
        />
        <template #error="{ error }">
          <p class="error-message">
            {{ error ?? '' }}
          </p>
        </template>
      </UFormGroup>
    </template>
  </UTable>
</template>
