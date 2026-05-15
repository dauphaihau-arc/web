<script setup lang="ts">
import type { ResponseGetDetailProduct } from '~/shared/types/request-api/product'
import { ProductVariantTypes } from '~/shared/config/enums/product'
import type { ElementType } from '~/shared/types/utils'

const props = defineProps<{
  product: ResponseGetDetailProduct
  inventorySelected: ElementType<ResponseGetDetailProduct['inventory']>
}>()

const sortedInventory = computed(() => {
  return props.product.inventory
    .slice()
    .sort((left, right) => {
      const leftPrice = left.salePrice ?? left.price
      const rightPrice = right.salePrice ?? right.price
      return leftPrice - rightPrice
    })
})

const plusSign = computed(() => {
  if (
    !props.inventorySelected
    && props.product.variantType !== ProductVariantTypes.NONE
  ) {
    return '+'
  }
  return ''
})

const highestPrice = computed(() => {
  if (
    !props.inventorySelected
    && props.product.variantType !== ProductVariantTypes.NONE
    && sortedInventory.value.length > 1
  ) {
    const highestInventory = sortedInventory.value[sortedInventory.value.length - 1]
    return highestInventory.salePrice ?? highestInventory.price
  }
  return ''
})

const baseInventory = computed(() => sortedInventory.value[0])

const lowestPrice = computed(() => {
  const inventory = props.inventorySelected ?? baseInventory.value
  return inventory ? (inventory.salePrice ?? inventory.price) : ''
})

const originPrice = computed(() => {
  const inventory = props.inventorySelected ?? baseInventory.value
  if (inventory?.salePrice !== undefined) {
    return inventory.price
  }
  return ''
})
</script>

<template>
  <div class="space-y-4">
    <!--            <div class="text-red-800 text-md font-semibold"> -->
    <!--              Only 6 left and in 7 baskets -->
    <!--            </div> -->

    <!--    {{ data?.product.variant_type }} -->

    <div>
      <div class="flex items-center space-x-3">
        <div class="flex items-center space-x-3">
          <div
            class="price"
            :class="originPrice && 'text-green-700'"
          >
            {{ convertCurrency(lowestPrice) }}{{ plusSign }}
            <span v-if="highestPrice">- {{ convertCurrency(highestPrice) }}</span>
          </div>
          <div
            v-if="originPrice"
            class="origin-price"
          >
            {{ convertCurrency(originPrice) }}
          </div>
        </div>
      </div>
      <!--      <div -->
      <!--        v-if="percentCoupon && percentCoupon.endInDays <= COUPON_CONFIG.AMOUNT_DAYS_WARN_END_SALE" -->
      <!--        class="mt-1 font-medium text-green-700" -->
      <!--      > -->
      <!--        Sale ends in {{ percentCoupon.endInDays }} days -->
      <!--      </div> -->
    </div>

    <!--    <div class="text-sm font-light text-zinc-500"> -->
    <!--      Local taxes included (where applicable) -->
    <!--    </div> -->

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
  @apply text-sm text-zinc-500 line-through;
}
</style>
