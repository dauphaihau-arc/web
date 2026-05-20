<script setup lang="ts">
import type { ResponseGetProductsProduct } from '~/shared/types/request-api/product'
import { PRODUCT_CONFIG } from '~/shared/config/enums/product'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  product: ResponseGetProductsProduct
}>()

const router = useRouter()
</script>

<template>
  <div
    class="flex cursor-pointer flex-col gap-2"
    @click="() => router.push(routes.productDetail(props.product.shop.slug, props.product.slug))"
  >
    <NuxtImg
      :src="props.product.image?.url"
      class="w-[200px] h-[200px] size-full rounded"
    />

    <div class="space-y-1">
      <h1 class="truncate text-xl font-semibold">
        {{ props.product?.title }}
      </h1>
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-base font-medium text-customGray-950">
          {{ convertCurrency(props.product.inventory?.sale_price || props.product.inventory?.price) }}
        </p>
      </div>
      <p class="text-sm text-customGray-800">
        {{ props.product?.shop.shop_name }}
      </p>
      <p
        v-if="props.product.inventory && props.product.inventory.stock < PRODUCT_CONFIG.LOW_STOCK"
        class="text-[13px] text-red-600"
      >
        Only {{ props.product.inventory.stock }} left - order soon
      </p>
    </div>
    <slot name="content" />
  </div>
</template>
