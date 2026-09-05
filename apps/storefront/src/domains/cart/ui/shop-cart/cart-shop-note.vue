<script setup lang="ts">
import ShopCartNoteUi from './shop-cart-note-ui.vue'
import type { CartShopGroup } from '~/domains/cart/api/cart.shared'

const props = defineProps<{
  shopCart: CartShopGroup
}>()

const cartStore = useCartStore()

const state = reactive({
  showNoteInput: false,
  note: '',
})

onMounted(() => {
  const orderShop = cartStore.additionInfoShopCarts.get(props.shopCart.shop.id)
  if (orderShop && orderShop.note) {
    state.showNoteInput = true
    state.note = orderShop.note
  }
})

watchDebounced(
  () => state.note,
  () => {
    if (props.shopCart?.shop?.id) {
      const orderShop = cartStore.additionInfoShopCarts.get(props.shopCart.shop.id)
      if (orderShop) {
        orderShop.note = state.note
        cartStore.additionInfoShopCarts.set(props.shopCart.shop.id, orderShop)
      }
    }
  },
  { debounce: 500, maxWait: 1000 },
)

watch(() => state.showNoteInput, () => {
  const additionInfoOrderShop = cartStore.additionInfoShopCarts.get(props.shopCart.shop.id)
  if (!state.showNoteInput && additionInfoOrderShop) {
    cartStore.additionInfoShopCarts.set(props.shopCart.shop.id, {
      ...additionInfoOrderShop,
      note: '',
    })
    state.note = ''
  }
})
</script>

<template>
  <ShopCartNoteUi
    v-model:note="state.note"
    v-model:show-input="state.showNoteInput"
    :shop-name="props.shopCart.shop?.name"
    :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
  />
</template>
