<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import { watchDebounced } from '@vueuse/core'
import { useCartStore } from '~/stores/cart'
import { useUpdateCart } from '~/services/cart'
import type {
  ResponseGetCart_ProductCart,
  ResponseGetCart,
  UpdateCartBody,
} from '~/types/request-api/cart'
import type { Shop } from '~/types/shop'

const props = defineProps<{
  productCart: ResponseGetCart_ProductCart
  shopId: Shop['id']
}>()

const cartStore = useCartStore()
const queryClient = useQueryClient()

const tempProductQty = ref(props.productCart.quantity)

const {
  mutate: updateCart,
} = useUpdateCart({
  onSuccess: (data) => {
    queryClient.setQueryData<ResponseGetCart>(['get-cart', 'my-cart'], (oldData) => {
      if (!oldData || !oldData.cart) return oldData
      if (data.cart === null) return { ...oldData, cart: null }
      const foundShopCart = data.cart.shop_carts.find(sc => sc.shop.id === props.shopId)
      if (!foundShopCart) return oldData

      // update total_shipping_fee field
      const newShopCarts = oldData.cart.shop_carts.map((sc) => {
        if (sc.shop.id === props.shopId) {
          const newProducts = sc.products.map((pc) => {
            if (pc.inventory.id === props.productCart.inventory.id) {
              return { ...pc, quantity: tempProductQty.value }
            }
            return pc
          })
          return {
            ...sc,
            products: newProducts,
            total_shipping_fee: foundShopCart?.total_shipping_fee,
          }
        }
        return sc
      })

      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          products_recent_update: data.cart.products_recent_update,
          shop_carts: newShopCarts,
        },
        summary_order: data.summary_order,
      }
    })
  },
})

const decreaseQty = () => {
  if (tempProductQty.value === 1) return
  tempProductQty.value--
}

watchDebounced(
  tempProductQty,
  async () => {
    const body: UpdateCartBody = {
      inventory_id: props.productCart.inventory.id,
      quantity: tempProductQty.value,
    }

    const addition_info_shop_carts = Array
      .from(cartStore.additionInfoShopCarts)
      .map(([keyShopId, value]) => ({
        shop_id: keyShopId,
        promo_codes: value?.promo_codes || [],
      }))
      .filter(item => item.promo_codes.length > 0)

    if (addition_info_shop_carts.length > 0) {
      body.addition_info_shop_carts = addition_info_shop_carts
    }

    updateCart(body)
  },
  { debounce: 500, maxWait: 1000 },
)
</script>

<template>
  <UButtonGroup
    size="lg"
    orientation="horizontal"
  >
    <UButton
      icon="i-heroicons-minus"
      color="white"
      class="rounded-l-md rounded-r-none"
      :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
      @click="decreaseQty"
    />
    <UInput
      v-model.number="tempProductQty"
      v-numeric
      v-max-number="props.productCart.inventory.stock"
      class="rounded-l-none"
      :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
      :ui="{ base: 'text-center rounded-l-none' }"
    />
    <UButton
      icon="i-heroicons-plus"
      color="white"
      class="rounded-l-none rounded-r-md"
      :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
      @click="() => tempProductQty++"
    />
  </UButtonGroup>
</template>
