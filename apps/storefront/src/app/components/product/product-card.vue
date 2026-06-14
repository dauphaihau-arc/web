<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'
import { getProductStockNotice } from '~/shared/utils/product-stock'
import { resolveProductImageUrl } from '~/shared/utils/storage-public-url'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  product: GetProductsResponseItem
}>()

const router = useRouter()
const config = useRuntimeConfig()

const imageUrl = computed(() => {
  return resolveProductImageUrl(
    props.product.image,
    config.public.assetHost,
    'card_1x1',
  )
})

const stockNotice = computed(() => {
  if (!props.product.inventory) {
    return ''
  }
  return getProductStockNotice(props.product.inventory.stock)
})

const displayAmount = computed(() => {
  const inventory = props.product.inventory
  if (!inventory) {
    return undefined
  }
  return formatMinorCurrency(inventory.amount_minor, inventory.currency)
})
</script>

<template>
  <div
    class="group flex h-full w-full cursor-pointer flex-col gap-1.5"
    @click="() => router.push(routes.productDetail(props.product.shop.slug, props.product.slug))"
  >
    <div class="flex h-[230px] w-full items-center justify-center overflow-hidden rounded-lg bg-customGray-200 ring-1 ring-border-subtle">
      <NuxtImg
        :src="imageUrl"
        class="size-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </div>

    <div class="flex min-h-[104px] flex-col gap-1">
      <h1 class="line-clamp-2 overflow-hidden text-sm font-semibold">
        {{ props.product?.title }}
      </h1>
      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="displayAmount !== undefined"
          class="text-base font-medium text-text-strong"
        >
          {{ displayAmount }}
        </p>
      </div>
      <div class="flex h-5 items-center gap-1 text-sm text-text-subtle">
        <AppIcon
          name="shop"
          size="xs"
        />
        <p class="truncate">
          {{ props.product?.shop.shop_name }}
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
