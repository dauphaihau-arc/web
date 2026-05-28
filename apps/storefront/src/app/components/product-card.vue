<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import type { GetProductsResponseItem } from '~/shared/api/product/contracts/product.contract'
import { getProductStockNotice } from '~/shared/utils/product-stock'
import { routes } from '~/shared/navigation/routes'

const props = defineProps<{
  product: GetProductsResponseItem
}>()

const router = useRouter()

const imageUrl = computed(() => {
  return props.product.image?.variants?.card_1x1?.url
    ?? props.product.image?.url
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
    class="group flex h-full w-full cursor-pointer flex-col gap-3"
    @click="() => router.push(routes.productDetail(props.product.shop.slug, props.product.slug))"
  >
    <div class="flex h-[230px] w-full items-center justify-center overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-customGray-200 p-3">
      <NuxtImg
        :src="imageUrl"
        class="size-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.03]"
      />
    </div>

    <div class="flex min-h-[104px] flex-col gap-1">
      <h1 class="line-clamp-2 overflow-hidden text-base font-semibold leading-6">
        {{ props.product?.title }}
      </h1>
      <div class="flex flex-wrap items-center gap-2">
        <p
          v-if="displayAmount !== undefined"
          class="text-base font-medium text-customGray-950"
        >
          {{ displayAmount }}
        </p>
      </div>
      <p class="h-5 truncate text-sm text-customGray-800">
        {{ props.product?.shop.shop_name }}
      </p>
      <p
        v-if="stockNotice"
        class="mt-auto text-[13px] text-red-600"
      >
        {{ stockNotice }}
      </p>
    </div>
    <slot name="content" />
  </div>
</template>
