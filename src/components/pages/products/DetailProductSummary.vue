<script setup lang="ts">
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import type { ResponseGetDetailProduct } from '~/types/request-api/product'
import { useGetDetailProduct } from '~/services/product'
import { PRODUCT_VARIANT_TYPES } from '~/config/enums/product'
import type { ElementType } from '~/types/utils'

dayjs.extend(relativeTime)

const props = defineProps<{
  product: ResponseGetDetailProduct['product']
  inventorySelected: ElementType<ResponseGetDetailProduct['product']['inventories']>
}>()

const route = useRoute()

const {
  data: dataGetDetailProduct,
} = useGetDetailProduct(route.params.id as string)

const percentCoupon = computed(() => {
  const coupon = dataGetDetailProduct.value?.percent_coupon
  if (coupon) {
    return {
      ...coupon,
      endInDays: Math.abs(dayjs(coupon.start_date).diff(coupon?.end_date, 'day')),
    }
  }
  return undefined
})

// product sale, have variants, variant not select yet
const plusSign = computed(() => {
  if (
    !props.inventorySelected
    && dataGetDetailProduct.value && dataGetDetailProduct.value.product.variant_type !== PRODUCT_VARIANT_TYPES.NONE
    && percentCoupon.value
  ) {
    return '+'
  }
  return ''
})

// product no sale, have variants, variant not select yet
const highestPrice = computed(() => {
  if (
    !props.inventorySelected
    && dataGetDetailProduct.value && dataGetDetailProduct.value.product.variant_type !== PRODUCT_VARIANT_TYPES.NONE
    && !percentCoupon.value
  ) {
    return dataGetDetailProduct.value.product.inventories[
      dataGetDetailProduct.value.product.inventories.length - 1
    ].price
  }
  return ''
})

// primary price
const lowestPrice = computed(() => {
  if (percentCoupon.value) {
    return props.inventorySelected?.sale_price || dataGetDetailProduct.value?.product.inventories[0].sale_price
  }
  return props.inventorySelected?.price || dataGetDetailProduct.value?.product.inventories[0].price
})

const originPrice = computed(() => {
  if (percentCoupon.value) {
    return props.inventorySelected?.price || dataGetDetailProduct.value?.product.inventories[0].price
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
            :class="percentCoupon && 'text-green-700'"
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
        <div>
          <UBadge
            v-if="percentCoupon && percentCoupon.percent_off"
            color="green"
          >
            {{ percentCoupon.percent_off }}% off
          </UBadge>
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
