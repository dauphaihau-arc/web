<script setup lang="ts">
import { ProductVariantTypes } from '@arc/enums/product'
import { formatMinorCurrency } from '@arc/utils'
import type { ElementType } from '@arc/contracts/utils'
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'

const props = defineProps<{
  product: GetDetailProductBySlugResponse
  inventorySelected?: ElementType<GetDetailProductBySlugResponse['inventory']>
  stockNotice?: string
}>()

const sortedInventory = computed(() => {
  return props.product.inventory
    .slice()
    .sort((left, right) => {
      const leftPrice = left.amount_minor
      const rightPrice = right.amount_minor
      return leftPrice - rightPrice
    })
})

const highestPrice = computed(() => {
  if (
    !props.inventorySelected
    && props.product.variant_type !== ProductVariantTypes.NONE
    && sortedInventory.value.length > 1
  ) {
    const highestInventory = sortedInventory.value[sortedInventory.value.length - 1]
    return formatMinorCurrency(highestInventory.amount_minor, highestInventory.currency)
  }
  return ''
})

const baseInventory = computed(() => sortedInventory.value[0])

const lowestPrice = computed(() => {
  const inventory = props.inventorySelected ?? baseInventory.value
  return inventory ? formatMinorCurrency(inventory.amount_minor, inventory.currency) : ''
})

const originPrice = computed(() => {
  const inventory = props.inventorySelected ?? baseInventory.value
  if (inventory?.original_amount_minor !== undefined) {
    return formatMinorCurrency(inventory.original_amount_minor, inventory.currency)
  }
  return ''
})
</script>

<template>
  <div class="space-y-4">
    <div
      v-if="props.stockNotice"
      class="text-sm font-semibold text-state-danger-text"
    >
      {{ props.stockNotice }}
    </div>

    <div>
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-3">
          <div
            class="price"
            :class="originPrice && 'text-primary'"
          >
            {{ lowestPrice }}
            <span v-if="highestPrice">- {{ highestPrice }}</span>
          </div>
          <div
            v-if="originPrice"
            class="origin-price"
          >
            {{ originPrice }}
          </div>
        </div>
      </div>
    </div>

    <div class="text-base">
      {{ product.title }}
    </div>
  </div>
</template>

<style scoped>
.price {
  @apply text-3xl font-medium;
}

.origin-price {
  @apply text-sm text-text-muted line-through;
}
</style>
