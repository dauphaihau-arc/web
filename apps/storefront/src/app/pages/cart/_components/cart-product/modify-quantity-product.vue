<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { useUpdateCart } from '~/shared/server-state/cart/update-cart.mutation'
import type { CartProductItem } from '~/shared/api/cart/cart.shared'
import type { GetCartResponse, UpdateCartRequest } from '~/shared/api/cart/contracts/cart.contract'

const props = defineProps<{
  productCart: CartProductItem
  shopId: string
}>()

const cartStore = useCartStore()
const queryClient = useQueryClient()

const tempProductQty = ref(props.productCart.quantity)

const {
  mutate: updateCart,
} = useUpdateCart({
  onSuccess: (data) => {
    queryClient.setQueryData<GetCartResponse>(['get-cart', 'my-cart'], (oldData) => {
      if (!oldData || !oldData.cart) return oldData
      if (data.cart === null) return { ...oldData, cart: null }
      const foundShopCart = data.cart.shop_groups.find(sc => sc.shop.id === props.shopId)
      if (!foundShopCart) return oldData

      const newShopGroups = oldData.cart.shop_groups.map((sc) => {
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
            shipping_minor: foundShopCart.shipping_minor,
          }
        }
        return sc
      })

      return {
        ...oldData,
        cart: {
          ...oldData.cart,
          recent_items: data.cart.recent_items,
          shop_groups: newShopGroups,
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
    const body: UpdateCartRequest = {
      inventory_id: props.productCart.inventory.id,
      quantity: tempProductQty.value,
    }

    const addition_info_shop_carts = Array
      .from(cartStore.additionInfoShopCarts)
      .map(([keyShopId, value]) => ({
        shop_id: keyShopId,
        promo_codes: value?.promoCodes || [],
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
