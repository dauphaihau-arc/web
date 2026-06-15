<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'
import { getProductStockNotice } from '~/shared/utils/product-stock'
import { resolveProductImageUrl } from '~/shared/utils/storage-public-url'
import { routes } from '~/shared/navigation/routes'

const { product } = defineProps<{
  product: GetProductsResponseItem
}>()

const router = useRouter()
const config = useRuntimeConfig()

const imageUrl = computed(() => {
  return resolveProductImageUrl(
    product.image,
    config.public.assetHost,
    'card_1x1',
  )
})

const stockNotice = computed(() => {
  if (!product.availability.in_stock) {
    return getProductStockNotice(0)
  }

  return product.availability.low_stock ? 'Low stock' : ''
})

const displayAmount = computed(() => {
  const pricing = product.pricing
  if (!pricing?.currency || pricing.min_amount_minor == null) {
    return undefined
  }

  const minAmount = formatMinorCurrency(pricing.min_amount_minor, pricing.currency)
  if (pricing.max_amount_minor != null && pricing.max_amount_minor > pricing.min_amount_minor) {
    return `From ${minAmount}`
  }

  return minAmount
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
      <p class="truncate text-[13px] text-text-strong">
        {{ product.shop.shop_name }}
      </p>

      <div class="">
        <p
          v-if="displayAmount !== undefined"
          class="text-base font-medium text-text-strong"
        >
          {{ displayAmount }}
        </p>
      </div>
      <p
        v-if="stockNotice"
        class="text-[13px] text-state-danger-text"
      >
        {{ stockNotice }}
      </p>
    </div>
    <slot name="content" />
  </div>
</template>
