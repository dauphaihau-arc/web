<script setup lang="ts">
import { PRODUCT_CONFIG } from '@arc/enums/product'
import type { VariantInputColumn, VariantInputTableRow } from './variant-input.types'

defineProps<{
  columns: VariantInputColumn[]
  currency?: string
  rows: VariantInputTableRow[]
  uppercaseSku?: boolean
}>()

defineEmits<{
  rowInput: [event: Event, row: VariantInputTableRow]
}>()
</script>

<template>
  <UTable
    :rows="rows"
    :columns="columns"
    class="mt-5"
    :ui="{
      th: { base: 'max-w-28 truncate' },
    }"
  >
    <template #variant_name-data="{ row }">
      <div class="min-w-44 max-w-44 truncate">
        {{ row.variant_name || '-' }}
      </div>
    </template>

    <template #sub_variant_name-data="{ row }">
      <div class="min-w-44 max-w-44 truncate">
        {{ row.sub_variant_name || '-' }}
      </div>
    </template>

    <template #amount-data="{ row }">
      <UFormGroup
        class="mt-6"
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
        class="mt-6"
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
      <UFormGroup class="mt-6">
        <UInput
          v-if="uppercaseSku"
          v-model="row.sku"
          v-alphanumeric
          v-uppercase
          :maxlength="PRODUCT_CONFIG.MAX_CHAR_SKU"
          name="sku"
          size="lg"
          @input="(event: Event) => $emit('rowInput', event, row)"
        />
        <UInput
          v-else
          v-model="row.sku"
          v-alphanumeric
          :maxlength="PRODUCT_CONFIG.MAX_CHAR_SKU"
          name="sku"
          size="lg"
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
