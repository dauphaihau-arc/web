<script setup lang="ts">
import { ROUTES } from '~/config/enums/routes'
import type { ResponseGetProducts_Product } from '~/types/request-api/product'
import { PRODUCT_CONFIG } from '~/config/enums/product'

const props = defineProps<{
  product: ResponseGetProducts_Product
}>()

const router = useRouter()
</script>

<template>
  <div
    class="flex cursor-pointer flex-col gap-2"
    @click="() => router.push(`${ROUTES.PRODUCTS}/${props.product?.id}`)"
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
          {{ convertCurrency(props.product.inventory?.salePrice || props.product.inventory?.price) }}
        </p>
      </div>
      <p class="text-sm text-customGray-800">
        {{ props.product?.shop.shopName }}
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
