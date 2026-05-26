<script setup lang="ts">
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'
import { getProductStockNotice } from '~/shared/utils/product-stock'
import { routes } from '~/shared/navigation/routes'

const { product } = defineProps<{
  product: GetProductsResponseItem
}>()

const router = useRouter()

const imageUrl = computed(() => {
  return product.image?.variants?.card_1x1?.url
    ?? product.image?.url
})

const stockNotice = computed(() => {
  if (!product.inventory) {
    return ''
  }

  return getProductStockNotice(product.inventory.stock)
})
</script>

<template>
  <div
    class="flex cursor-pointer flex-col gap-2"
    @click="() => router.push(routes.productDetail(product.shop.slug, product.slug))"
  >
    <NuxtImg
      :src="imageUrl"
      width="210"
      height="160"
      class="rounded"
      preload
    />
    <div class="space-y-0.5">
      <h1 class="truncate text-[13px]">
        {{ product.title }}
      </h1>
      <p class="truncate text-[13px] text-customGray-900">
        {{ product.shop.shop_name }}
      </p>

      <div class="">
        <p class="text-base font-medium text-customGray-950">
          {{ convertCurrency(product.inventory?.sale_price || product.inventory?.price) }}
        </p>
      </div>
      <p
        v-if="stockNotice"
        class="text-[13px] text-red-600"
      >
        {{ stockNotice }}
      </p>
    </div>
    <slot name="content" />
  </div>
</template>
