<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import ShopCart from './_components/shop-cart.vue'
import SummaryOrder from './_components/summary-order.vue'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { useGetCart } from '~/shared/server-state/cart/cart.query'

definePageMeta({ layout: 'market' })

const cartStore = useCartStore()

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()

watch(dataGetCart, () => {
  if (cartStore.additionInfoShopCarts.size === 0 && dataGetCart.value?.cart?.shop_groups) {
    dataGetCart.value.cart.shop_groups.forEach((item) => {
      cartStore.additionInfoShopCarts.set(item.shop.id, {
        promoCodes: [],
        note: '',
      })
    })
  }
}, { immediate: true })
</script>

<template>
  <div class="mt-2 py-12">
    <div
      v-if="isPendingGetCart"
      class="grid h-[80vh] w-full place-content-center"
    >
      <LoadingSvg :child-class="'!w-12 !h-12'" />
    </div>
    <div v-else-if="dataGetCart?.cart && dataGetCart.cart.shop_groups?.length > 0">
      <div>
        <h1 class="mb-4 text-2xl font-medium">
          {{ dataGetCart?.cart?.total_quantity }} products in your cart
        </h1>

        <div class="grid grid-cols-12 gap-16">
          <div class="col-span-8">
            <ShopCart
              v-for="shopCart of dataGetCart.cart.shop_groups"
              :key="shopCart.shop.id"
              :shop-cart="shopCart"
            />
          </div>

          <div class="col-span-4">
            <div class="sticky top-24 w-[400px]">
              <SummaryOrder />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="text-center"
    >
      <h3 class="text-3xl text-text-strong">
        Your cart is empty.
      </h3>
    </div>
  </div>
</template>
