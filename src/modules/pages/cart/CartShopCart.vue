<script setup lang="ts">
import CartAddRemoveNote from '~/modules/pages/cart/CartAddRemoveNote.vue'
import CartShippingSelect from '~/modules/pages/cart/CartShippingSelect.vue'
import type { ResponseGetCart_ShopCart } from '~/shared/types/request-api/cart'

const props = defineProps<{
  shopCart: ResponseGetCart_ShopCart
}>()
</script>

<template>
  <UCard
    v-if="props.shopCart.items.length > 0"
    :ui="{ base: 'overflow-visible' }"
    class="mb-10"
  >
    <div class="flex flex-col">
      <div class="-ml-1 mb-4 flex items-center gap-3">
        <UIcon
          name="i-solar:shop-bold-duotone"
          class="size-8"
        />
        <h3 class="text-lg font-medium">
          {{ props.shopCart.shop?.name }}
        </h3>
      </div>
      <div>
        <div
          v-for="(productCart) of props.shopCart.items"
          :key="productCart.inventory.id"
        >
          <CartProduct
            :product-cart="productCart"
            :shop-id="props.shopCart.shop?.id"
          />
        </div>
      </div>

      <UDivider />

      <div class="mt-6 flex justify-between">
        <div class="flex w-fit flex-col gap-4">
          <CartAddRemoveCoupons :shop-id="props.shopCart.shop?.id" />
          <CartAddRemoveNote :shop-cart="props.shopCart" />
        </div>
        <CartShippingSelect
          :shop-cart="props.shopCart"
        />
      </div>
    </div>
  </UCard>
</template>
