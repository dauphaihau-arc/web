<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import VariantsProduct from './variants-product.vue'
import type { ResponseGetOrderShopsProduct } from '~/shared/api/me/order/contracts/order.contract'
import { routes } from '~/shared/navigation/routes'

const { productOrder } = defineProps<{
  productOrder: ResponseGetOrderShopsProduct
}>()

const displayAmount = computed(() => formatMinorCurrency(productOrder.amount_minor, productOrder.currency))
const compareAtAmount = computed(() =>
  productOrder.original_amount_minor
    ? formatMinorCurrency(productOrder.original_amount_minor, productOrder.currency)
    : undefined,
)
</script>

<template>
  <div class="mt-10 flex gap-5">
    <NuxtImg
      :src="productOrder?.image_url"
      width="180"
      height="180"
      class="max-h-[180px] max-w-[180px] cursor-pointer rounded"
    />

    <div class="flex w-full justify-between">
      <div class="space-y-4">
        <div class="space-y-1.5">
          <div class="text-xl font-normal">
            {{ productOrder?.title }}
          </div>
          <div class="space-y-1.5 text-zinc-500">
            <VariantsProduct :product-order="productOrder" />
            <div class="">
              Quantity: {{ productOrder?.quantity }}
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <UButton
            :to="routes.productDetail(productOrder.product.shop.slug, productOrder.product.slug)"
            size="md"
          >
            Buy this again
          </UButton>
        </div>
      </div>
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div
            v-if="compareAtAmount && productOrder.percent_coupon"
            class="text-right"
          >
            <div class="text-xl font-medium text-customGray-950">
              {{ displayAmount }}
            </div>
            <div class="text-sm text-zinc-500">
              <span class="line-through">
                {{ compareAtAmount }}
              </span>
              ({{ productOrder.percent_coupon.percent_off }}% off)
            </div>
          </div>
          <div
            v-else
            class="font-medium text-customGray-950"
          >
            {{ displayAmount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
