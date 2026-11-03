<script setup lang="ts">
import { clampShipmentQuantity } from './shipments.presentation'

type QuantityRow = {
  orderItemId: string
  title: string
  hint: string
  max: number
}

defineProps<{
  rows: QuantityRow[]
  errors?: Record<string, string | undefined>
}>()

const quantities = defineModel<Record<string, number>>({ required: true })

/**
 * Text the seller is still editing. It is the only place a value can sit
 * outside `[0, max]`; the model always follows it, and blur settles both.
 */
const drafts = reactive<Record<string, string | undefined>>({})

function displayed(row: QuantityRow) {
  const draft = drafts[row.orderItemId]

  if (draft !== undefined) {
    return draft
  }

  const value = quantities.value?.[row.orderItemId]

  return Number.isFinite(value) ? String(value) : ''
}

function typedQuantity(value: number | string) {
  if (typeof value === 'number') {
    return value
  }

  return value.trim() === '' ? Number.NaN : Number(value)
}

function onInput(row: QuantityRow, value: number | string) {
  drafts[row.orderItemId] = String(value)
  quantities.value = {
    ...quantities.value,
    [row.orderItemId]: typedQuantity(value),
  }
}

/**
 * Leaving the field is what the seller sees as committing the quantity: an
 * out-of-range entry collapses to the nearest shippable one and the row error
 * goes away with it.
 */
function settle(row: QuantityRow) {
  const edited = drafts[row.orderItemId]
  const value = edited === undefined
    ? quantities.value?.[row.orderItemId]
    : typedQuantity(edited)

  drafts[row.orderItemId] = undefined
  quantities.value = {
    ...quantities.value,
    [row.orderItemId]: clampShipmentQuantity(value, row.max),
  }
}

function settleOnEnter(event: KeyboardEvent) {
  (event.target as HTMLInputElement | null)?.blur()
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="row in rows"
      :key="row.orderItemId"
      class="flex items-start justify-between gap-4"
    >
      <div class="min-w-0">
        <div class="truncate text-sm text-text-strong">
          {{ row.title }}
        </div>
        <div class="text-xs text-text-muted">
          {{ row.hint }}
        </div>
      </div>
      <div class="flex flex-col items-end gap-1">
        <UInput
          :model-value="displayed(row)"
          type="number"
          :min="0"
          :max="row.max"
          :disabled="row.max === 0"
          :aria-invalid="Boolean(errors?.[row.orderItemId])"
          :data-order-item-id="row.orderItemId"
          class="w-24"
          size="sm"
          @update:model-value="onInput(row, $event)"
          @blur="settle(row)"
          @keydown.enter="settleOnEnter"
        />
        <p
          v-if="errors?.[row.orderItemId]"
          data-testid="quantity-error"
          :data-order-item-id="row.orderItemId"
          class="max-w-48 text-right text-xs text-red-600"
        >
          {{ errors[row.orderItemId] }}
        </p>
      </div>
    </div>
  </div>
</template>
