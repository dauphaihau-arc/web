<script setup lang="ts">
import type { ResponseGetCart_ShopCart } from '~/shared/types/request-api/cart'
import CartShippingSelect from '~/modules/pages/cart/CartShippingSelect.vue'
import CartAddRemoveNote from '~/modules/pages/cart/CartAddRemoveNote.vue'

const props = defineProps<{
  shopCart: ResponseGetCart_ShopCart
}>()
</script>

<template>
  <UCard
    v-if="props.shopCart.items.length > 0 && props.shopCart.items.some(prod => !!prod.isSelected)"
    :ui="{ base: 'overflow-visible' }"
    class="mb-4"
  >
    <div class="flex flex-col">
      <h3 class="mb-3 text-lg font-medium">
        {{ props.shopCart?.shop?.name }}
      </h3>

      <div>
        <div
          v-for="(productCart) of props.shopCart.items"
          :key="productCart?.inventory?.id"
        >
          <CartProduct
            v-if="productCart?.isSelected"
            :product-cart="productCart"
            :shop-id="props.shopCart?.shop?.id"
          />
        </div>
      </div>

      <UDivider />

      <div class="mt-6 flex justify-between">
        <div class="flex w-fit flex-col gap-4">
          <CartAddRemoveCoupons :shop-id="props.shopCart?.shop?.id" />
          <CartAddRemoveNote :shop-cart="props.shopCart" />
        </div>
        <CartShippingSelect :shop-cart="props.shopCart" />
      </div>
    </div>
  </UCard>
</template>
