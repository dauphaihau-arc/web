<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import { watchDebounced } from '@vueuse/core'
import { useCartStore } from '~/shared/stores/cart'
import { useUpdateCart } from '~/shared/services/cart'
import type {
  ResponseGetCartProductCart,
  ResponseGetCart,
  UpdateCartBody,
} from '~/shared/types/request-api/cart'
import type { Shop } from '~/shared/types/shop'

const props = defineProps<{
  productCart: ResponseGetCartProductCart
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
      const foundShopCart = data.cart.shopGroups.find(sc => sc.shop.id === props.shopId)
      if (!foundShopCart) return oldData

      const newShopGroups = oldData.cart.shopGroups.map((sc) => {
        if (sc.shop.id === props.shopId) {
          const newItems = sc.items.map((pc) => {
            if (pc.inventory.id === props.productCart.inventory.id) {
              return { ...pc, quantity: tempProductQty.value }
            }
            return pc
          })
          return {
            ...sc,
            items: newItems,
            totalShippingFee: foundShopCart.totalShippingFee,
          }
        }
        return sc
      })

      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          recentItems: data.cart.recentItems,
          shopGroups: newShopGroups,
        },
        summary: data.summary,
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
      inventoryId: props.productCart.inventory.id,
      quantity: tempProductQty.value,
    }

    const additionInfoShopCarts = Array
      .from(cartStore.additionInfoShopCarts)
      .map(([keyShopId, value]) => ({
        shopId: keyShopId,
        promoCodes: value?.promoCodes || [],
      }))
      .filter(item => item.promoCodes.length > 0)

    if (additionInfoShopCarts.length > 0) {
      body.additionInfoShopCarts = additionInfoShopCarts
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
