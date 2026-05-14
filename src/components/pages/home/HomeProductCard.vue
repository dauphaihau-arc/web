<script setup lang="ts">
import { ROUTES } from '~/config/enums/routes'
import type { ResponseGetProducts_Product } from '~/types/request-api/product'

const props = defineProps<{
  product: ResponseGetProducts_Product
}>()

const salePercentCoupon = computed(() => {
  return props.product?.percent_coupon
})
</script>

<template>
  <NuxtLink
    class="relative flex cursor-pointer flex-col gap-2"
    :to="`${ROUTES.PRODUCTS}/${props.product.id}`"
  >
    <NuxtImg
      :src="`domainAwsS3/${props.product.image_relative_url}`"
      width="250"
      height="160"
      class="size-full rounded-lg"
    />
    <div class="absolute bottom-3 left-3 flex gap-1 space-y-0.5 rounded-lg bg-white px-2.5 py-1">
      <p class="text-md font-medium text-customGray-950">
        {{ convertCurrency(props.product.inventory?.sale_price || props.product.inventory?.price) }}
      </p>
      <p
        v-if="salePercentCoupon"
        class="text-sm font-medium text-customGray-950 line-through decoration-1"
      >
        {{ convertCurrency(props.product.inventory.price) }}
      </p>
    </div>
    <slot name="content" />
  </NuxtLink>
</template>
