<script setup lang="ts">
import type { CartShopGroup } from '~/shared/api/cart/cart.shared'
import AddRemoveCoupons from '~/app/components/cart/add-remove-coupons.vue'
import ShippingSelect from '~/app/components/cart/shipping-select.vue'
import AddRemoveNote from '~/app/components/cart/add-remove-note.vue'
import Product from '~/app/components/cart/cart-product/cart-product.vue'

const props = defineProps<{
  shopCart: CartShopGroup
}>()
</script>

<template>
  <UCard
    v-if="props.shopCart.items.length > 0 && props.shopCart.items.some(prod => !!prod.is_selected)"
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
          <Product
            v-if="productCart?.is_selected"
            :product-cart="productCart"
            :shop-id="props.shopCart?.shop?.id"
          />
        </div>
      </div>

      <UDivider />

      <div class="mt-6 flex justify-between">
        <div class="flex w-fit flex-col gap-4">
          <AddRemoveCoupons :shop-id="props.shopCart?.shop?.id" />
          <AddRemoveNote :shop-cart="props.shopCart" />
        </div>
        <ShippingSelect :shop-cart="props.shopCart" />
      </div>
    </div>
  </UCard>
</template>
