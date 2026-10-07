<script lang="ts" setup>
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import ShopCart from './_components/shop-cart.vue'
import SummaryOrder from './_components/summary-order.vue'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useGetCart } from '~/domains/cart/queries/cart.query'

definePageMeta({ layout: 'market' })

const cartStore = useCartStore()

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()

if (import.meta.client) {
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
}
</script>

<template>
  <div class="mt-2 py-12">
    <Empty
      v-if="isPendingGetCart"
      loading
      size="xl"
      variant="naked"
      description="Loading your cart..."
      container-class="h-[80vh] w-full"
    />
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
    <Empty
      v-else
      variant="naked"
      size="2xl"
      :icon="ICON_NAME_BY_ALIAS['cart']"
      title="Your cart is empty."
      container-class="h-[80vh] w-full"
    />
  </div>
</template>
