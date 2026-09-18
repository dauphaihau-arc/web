<script setup lang="ts">
import CheckoutNowPromoCoupons from './checkout-now-promo-coupons.vue'
import ShopCartCard from '~/domains/cart/ui/shop-cart/shop-cart-card.vue'
import ShopCartFooter from '~/domains/cart/ui/shop-cart/shop-cart-footer.vue'
import ShopCartNoteUi from '~/domains/cart/ui/shop-cart/shop-cart-note-ui.vue'
import ShopCartProduct from '~/domains/cart/ui/shop-cart/shop-cart-product.vue'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useGetCart } from '~/domains/cart/queries/cart.query'

const cartStore = useCartStore()
const route = useRoute()

const tempCartId = route.query['c'] as string

const {
  data: dataGetCart,
} = useGetCart({ cart_id: tempCartId })

const shopCart = computed(() => dataGetCart.value?.cart && dataGetCart?.value?.cart.shop_groups[0])
const productCart = computed(() => shopCart.value?.items[0])
const showNoteInput = ref(!!cartStore.stateCheckoutNow.note)
</script>

<template>
  <ShopCartCard
    v-if="shopCart && productCart"
    :shop-name="shopCart?.shop?.name"
  >
    <ShopCartProduct
      :product-cart="productCart"
      :show-quantity-controls="false"
    />

    <template #footer>
      <ShopCartFooter>
        <template #coupons>
          <CheckoutNowPromoCoupons />
        </template>

        <template #note>
          <ShopCartNoteUi
            v-model:note="cartStore.stateCheckoutNow.note"
            v-model:show-input="showNoteInput"
            :shop-name="shopCart.shop.name"
            :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
          />
        </template>
      </ShopCartFooter>
    </template>
  </ShopCartCard>
</template>

<style scoped>

</style>
