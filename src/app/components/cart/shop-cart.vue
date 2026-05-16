<script setup lang="ts">
import AddRemoveCoupons from '~/app/components/cart/add-remove-coupons.vue'
import AddRemoveNote from '~/app/components/cart/add-remove-note.vue'
import Product from '~/app/components/cart/cart-product/cart-product.vue'
import ShippingSelect from '~/app/components/cart/shipping-select.vue'
import type { ResponseGetCartShopCart } from '~/shared/types/request-api/cart'

const props = defineProps<{
  shopCart: ResponseGetCartShopCart
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
          <Product
            :product-cart="productCart"
            :shop-id="props.shopCart.shop?.id"
          />
        </div>
      </div>

      <UDivider />

      <div class="mt-6 flex justify-between">
        <div class="flex w-fit flex-col gap-4">
          <AddRemoveCoupons :shop-id="props.shopCart.shop?.id" />
          <AddRemoveNote :shop-cart="props.shopCart" />
        </div>
        <ShippingSelect
          :shop-cart="props.shopCart"
        />
      </div>
    </div>
  </UCard>
</template>
