<script setup lang="ts">
import type { CartSummary } from '~/shared/types/request-api/cart'

const props = defineProps<{
  loading: boolean
  summaryOrder?: CartSummary
}>()
</script>

<template>
  <UCard v-if="props.summaryOrder">
    <div class="space-y-7">
      <legend class="mb-1 text-xl font-bold text-gray-700 dark:text-gray-200">
        Summary Order
      </legend>
      <div
        v-if="props.loading"
        class="grid h-48 place-content-center"
      >
        <LoadingSvg :child-class="'!w-9 !h-9'" />
      </div>
      <div
        v-else-if="props?.summaryOrder"
        class="flex flex-col"
      >
        <div class="flex justify-between">
          <div class="title">
            <div>Product(s) total</div>
            <div>Shop discount</div>
          </div>
          <div class="price">
            <div>
              {{ convertCurrency(props.summaryOrder?.subtotalPrice) }}
            </div>
            <div class="text-right">
              {{ convertCurrency(props?.summaryOrder?.totalDiscount) }}
            </div>
          </div>
        </div>
        <UDivider class="my-3" />
        <div class="flex justify-between gap-3">
          <div class="title">
            <div>Subtotal</div>
            <div>Shipping</div>
          </div>
          <div class="price">
            <div>
              {{ convertCurrency(props?.summaryOrder?.subtotalAfterDiscount) }}
            </div>
            <div
              v-if="props.summaryOrder?.totalShippingFee === 0
                && props.summaryOrder.totalSelectedQuantity"
              class="text-right font-normal text-green-600"
            >
              FREE
            </div>
            <div
              v-else
              class="text-right"
            >
              {{ convertCurrency(props?.summaryOrder?.totalShippingFee) }}
            </div>
          </div>
        </div>
        <UDivider class="my-3" />
        <div class="flex justify-between gap-3">
          <div class="text-lg font-medium">
            Total ({{ props.summaryOrder?.totalSelectedQuantity }} {{ props.summaryOrder?.totalSelectedQuantity > 1 ? 'products' : 'product' }})
          </div>
          <div :class="['price', props.summaryOrder?.totalPrice > 0 && 'text-red-500']">
            {{ convertCurrency(props.summaryOrder?.totalPrice) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.title {
  @apply text-lg font-normal text-customGray-900
}

.price {
  @apply text-right text-lg font-medium
}
</style>
