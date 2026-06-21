<script setup lang="ts">
import { ProductVariantTypes } from '@arc/enums/product'
import { formatMinorCurrency } from '@arc/utils'
import type { ElementType } from '@arc/contracts/utils'
import type { GetDetailProductBySlugResponse } from '~/shared/api/product/contracts/product.contract'

type SummaryProduct = Pick<
  GetDetailProductBySlugResponse,
  'inventory' | 'variant_type' | 'review_summary' | 'title'
>

const props = defineProps<{
  product?: GetDetailProductBySlugResponse
  inventorySelected?: ElementType<GetDetailProductBySlugResponse['inventory']>
  stockNotice?: string
  isLoading?: boolean
}>()

const fallbackProduct: SummaryProduct = {
  inventory: [],
  variant_type: ProductVariantTypes.NONE,
  review_summary: {
    average: 0,
    count: 0,
  },
  title: '',
}

const product = computed<SummaryProduct>(() => props.product ?? fallbackProduct)

const sortedInventory = computed(() => {
  return product.value.inventory
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
    && product.value.variant_type !== ProductVariantTypes.NONE
    && sortedInventory.value.length > 1
  ) {
    const lowestInventory = sortedInventory.value[0]
    const highestInventory = sortedInventory.value[sortedInventory.value.length - 1]
    if (highestInventory.amount_minor === lowestInventory.amount_minor) {
      return ''
    }
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
  if (
    inventory?.original_amount_minor !== undefined
    && inventory.original_amount_minor > inventory.amount_minor
  ) {
    return formatMinorCurrency(inventory.original_amount_minor, inventory.currency)
  }
  return ''
})

const salePercent = computed(() => {
  const inventory = props.inventorySelected ?? baseInventory.value
  if (
    !inventory
    || inventory.original_amount_minor == null
    || inventory.original_amount_minor <= inventory.amount_minor
  ) {
    return ''
  }

  return Math.round(
    ((inventory.original_amount_minor - inventory.amount_minor) / inventory.original_amount_minor) * 100,
  )
})

const hasDiscount = computed(() => originPrice.value !== '')
const reviewAverage = computed(() => Number(product.value.review_summary.average || 0))
const reviewCount = computed(() => Number(product.value.review_summary.count || 0))

const filledStars = computed(() => {
  return Math.round(reviewAverage.value)
})
</script>

<template>
  <div
    v-if="props.isLoading"
    class="space-y-5"
    aria-busy="true"
    aria-live="polite"
  >
    <USkeleton class="h-4 w-28 !bg-customGray-300/85" />
    <div class="flex items-center gap-3">
      <USkeleton class="h-8 w-32 !bg-customGray-300/85" />
      <USkeleton class="h-6 w-20 !bg-customGray-300/85" />
    </div>
    <USkeleton class="h-10 w-4/5 !bg-customGray-300/85" />
    <USkeleton class="h-4 w-32 !bg-customGray-300/85" />
  </div>

  <div
    v-else
    class="space-y-4"
  >
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
            :class="hasDiscount && 'text-[var(--state-success-text)]'"
          >
            {{ lowestPrice }}
            <span v-if="highestPrice">- {{ highestPrice }}</span>
          </div>
          <div
            v-if="originPrice"
            class="flex items-center gap-2"
          >
            <div class="origin-price">
              {{ originPrice }}
            </div>
            <div
              v-if="salePercent"
              class="text-base text-text-muted"
            >
              ({{ salePercent }}% off)
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-base">
      {{ product.title }}
    </div>

    <div
      v-if="reviewCount > 0"
      class="flex items-center gap-3 text-sm text-text-subtle"
    >
      <div class="flex items-center gap-1 text-[#FFB100]">
        <AppIcon
          v-for="index in 5"
          :key="index"
          name="star"
          size="xs"
          :class="index <= filledStars ? 'opacity-100' : 'opacity-25'"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.price {
  @apply text-3xl font-medium;
}

.origin-price {
  @apply text-base text-text-muted line-through;
}
</style>
