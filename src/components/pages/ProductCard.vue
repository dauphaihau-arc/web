<script setup lang="ts">
import { ROUTES } from '~/config/enums/routes'
import type { ResponseGetProducts_Product } from '~/types/request-api/product'
import { PRODUCT_CONFIG } from '~/config/enums/product'

const props = defineProps<{
  product: ResponseGetProducts_Product
}>()

const router = useRouter()

const freeShipCoupon = computed(() => {
  return props.product?.free_ship_coupon
})

const salePercentCoupon = computed(() => {
  return props.product?.percent_coupon
})
</script>

<template>
  <div
    class="flex cursor-pointer flex-col gap-2"
    @click="() => router.push(`${ROUTES.PRODUCTS}/${props.product?.id}`)"
  >
    <NuxtImg
      :src="`domainAwsS3/${props.product?.image_relative_url}`"
      width="200"
      height="200"
      class="size-full rounded"
    />

    <div class="space-y-1">
      <h1 class="truncate text-xl font-semibold">
        {{ props.product?.title }}
      </h1>
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-base font-medium text-customGray-950">
          {{ convertCurrency(props.product.inventory?.sale_price || props.product.inventory?.price) }}
        </p>
        <p
          v-if="salePercentCoupon"
          class="text-sm font-medium text-customGray-950 line-through decoration-1"
        >
          {{ convertCurrency(props.product.inventory.price) }}
        </p>
        <p
          v-if="salePercentCoupon"
          class="text-sm text-green-500"
        >
          ({{ salePercentCoupon.percent_off }}% off)
        </p>
      </div>
      <p class="text-sm text-customGray-800">
        {{ props.product?.shop.shop_name }}
      </p>
      <UBadge
        v-if="freeShipCoupon"
        color="green"
        variant="solid"
      >
        Free shipping
      </UBadge>
      <p
        v-if="props.product.inventory.stock < PRODUCT_CONFIG.LOW_STOCK"
        class="text-[13px] text-red-600"
      >
        Only {{ props.product.inventory.stock }} left - order soon
      </p>
    </div>
    <slot name="content" />
  </div>
</template>
