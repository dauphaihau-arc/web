<script setup lang="ts">
import { ROUTES } from '~/config/enums/routes'
import type { ResponseGetProducts_Product } from '~/types/request-api/product'
import { PRODUCT_CONFIG } from '~/config/enums/product'

const { product } = defineProps<{
  product: ResponseGetProducts_Product
}>()

const router = useRouter()

const freeShipCoupon = computed(() => {
  return product?.free_ship_coupon
})

const salePercentCoupon = computed(() => {
  return product?.percent_coupon
})
</script>

<template>
  <div
    class="flex cursor-pointer flex-col gap-2"
    @click="() => router.push(`${ROUTES.PRODUCTS}/${product.id}`)"
  >
    <NuxtImg
      :src="`domainAwsS3/${product.image_relative_url}`"
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

        <div class="flex flex-wrap items-center gap-2">
          <p
            v-if="salePercentCoupon"
            class="text-sm font-medium text-customGray-950 line-through decoration-1"
          >
            {{ convertCurrency(product.inventory.price) }}
          </p>
          <p
            v-if="salePercentCoupon"
            class="text-sm text-green-500"
          >
            ({{ salePercentCoupon.percent_off }}% off)
          </p>
        </div>
      </div>
      <UBadge
        v-if="freeShipCoupon"
        color="green"
        variant="solid"
      >
        Free shipping
      </UBadge>
      <p
        v-if="product.inventory.stock < PRODUCT_CONFIG.LOW_STOCK"
        class="text-[13px] text-red-600"
      >
        Only {{ product.inventory.stock }} left - order soon
      </p>
    </div>
    <slot name="content" />
  </div>
</template>
