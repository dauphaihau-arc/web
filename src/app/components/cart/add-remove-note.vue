<script setup lang="ts">
/*
  use in cart page, cart/checkout page
 */
import { ORDER_CONFIG } from '~/shared/config/enums/order'
import type { CartShopGroup } from '~/shared/api/me/cart/cart.shared'

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
  <div>
    <UButton
      variant="ghost"
      icon="i-heroicons-clipboard-document-list"
      color="gray"
      class="mb-1 w-fit"
      :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
      @click="state.showNoteInput = !state.showNoteInput"
    >
      Add a note to
      {{ props?.shopCart.shop?.name }}
    </UButton>

    <UFormGroup
      v-if="state.showNoteInput"
      name="description"
      required
    >
      <UTextarea
        v-model="state.note"
        autoresize
        :maxlength="ORDER_CONFIG.MAX_CHAR_NOTE"
        :rows="3"
        size="lg"
      />
    </UFormGroup>
  </div>
</template>
