<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
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

const displayAmount = computed(() => {
  const inventory = product.inventory
  if (!inventory) {
    return undefined
  }

  return formatMinorCurrency(inventory.amount_minor, inventory.currency)
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
        <p
          v-if="displayAmount !== undefined"
          class="text-base font-medium text-customGray-950"
        >
          {{ displayAmount }}
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
