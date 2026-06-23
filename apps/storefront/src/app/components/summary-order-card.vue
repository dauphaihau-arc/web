<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { CartSummary } from '~/shared/api/cart/cart.shared'

const props = defineProps<{
  loading: boolean
  summaryOrder?: CartSummary
}>()
</script>

<template>
  <UCard v-if="props.summaryOrder">
    <div class="space-y-7">
      <legend class="mb-1 text-xl font-bold text-text-subtle">
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
              {{ formatMinorCurrency(props.summaryOrder?.subtotal_minor, props.summaryOrder?.currency) }}
            </div>
            <div class="text-right">
              {{ formatMinorCurrency(props?.summaryOrder?.discount_minor, props.summaryOrder?.currency) }}
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
              {{ formatMinorCurrency(props?.summaryOrder?.subtotal_after_discount_minor, props.summaryOrder?.currency) }}
            </div>
            <div
              v-if="props.summaryOrder?.shipping_minor === 0
                && props.summaryOrder.total_selected_quantity"
              class="text-right font-normal text-[var(--state-success-text)]"
            >
              FREE
            </div>
            <div
              v-else
              class="text-right"
            >
              {{ formatMinorCurrency(props?.summaryOrder?.shipping_minor, props.summaryOrder?.currency) }}
            </div>
          </div>
        </div>
        <UDivider class="my-3" />
        <div class="flex justify-between gap-3">
          <div class="text-lg font-medium">
            Total ({{ props.summaryOrder?.total_selected_quantity }} {{ props.summaryOrder?.total_selected_quantity > 1 ? 'products' : 'product' }})
          </div>
          <div :class="['price', props.summaryOrder?.total_minor > 0 && 'text-text-strong']">
            {{ formatMinorCurrency(props.summaryOrder?.total_minor, props.summaryOrder?.currency) }}
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<style scoped lang="postcss">
.title {
  @apply text-lg font-normal text-text-strong
}

.price {
  @apply text-right text-lg font-medium
}
</style>
