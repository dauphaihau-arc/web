<script setup lang="ts">
import { ROUTES } from '~/config/enums/routes'
import type { ResponseGetProducts_Product } from '~/types/request-api/product'
import { PRODUCT_CONFIG } from '~/config/enums/product'

const { product } = defineProps<{
  product: ResponseGetProducts_Product
}>()

const router = useRouter()
</script>

<template>
  <div
    class="flex cursor-pointer flex-col gap-2"
    @click="() => router.push(`${ROUTES.PRODUCTS}/${product.id}`)"
  >
    <NuxtImg
      :src="product.image?.url"
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
        {{ product.shop.shopName }}
      </p>

      <div class="">
        <p class="text-base font-medium text-customGray-950">
          {{ convertCurrency(product.inventory?.salePrice || product.inventory?.price) }}
        </p>
      </div>
      <p
        v-if="product.inventory && product.inventory.stock < PRODUCT_CONFIG.LOW_STOCK"
        class="text-[13px] text-red-600"
      >
        Only {{ product.inventory.stock }} left - order soon
      </p>
    </div>
    <slot name="content" />
  </div>
</template>
