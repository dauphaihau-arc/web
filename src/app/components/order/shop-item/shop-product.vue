<script setup lang="ts">
import VariantsProduct from './variants-product.vue'
import type { ResponseGetOrderShopsProduct } from '~/shared/api/me/order/orders.shared'
import { routes } from '~/shared/navigation/routes'

const { productOrder } = defineProps<{
  productOrder: ResponseGetOrderShopsProduct
}>()
</script>

<template>
  <div class="mt-9 flex gap-5">
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
            v-if="productOrder.sale_price && productOrder.percent_coupon"
            class="text-right"
          >
            <div class="text-xl font-medium text-customGray-950">
              {{ convertCurrency(productOrder.sale_price) }}
            </div>
            <div class="text-sm text-zinc-500">
              <span class="line-through">
                {{ convertCurrency(productOrder.price) }}
              </span>
              ({{ productOrder.percent_coupon.percent_off }}% off)
            </div>
          </div>
          <div
            v-else
            class="font-medium text-customGray-950"
          >
            {{ convertCurrency(productOrder?.price) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
