<script setup lang="ts">
import ShopCartQuantityUi from './shop-cart-quantity-ui.vue'
import { watchDebounced } from '@vueuse/core'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation'
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update'
import { buildCartAdjustments } from '~/domains/cart/utils/cart-adjustments'
import type { CartProductItem } from '~/domains/cart/api/cart.shared'
import type { GetCartResponse, UpdateCartRequest } from '~/domains/cart/api/contracts/cart.contract'

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
    queryClient.setQueryData<GetCartResponse>(
      ['get-cart', 'my-cart'],
      oldData => applyPricedCartUpdate(oldData, data),
    )
  },
})

watchDebounced(
  tempProductQty,
  async () => {
    const body: UpdateCartRequest = {
      inventory_id: props.productCart.inventory.id,
      quantity: tempProductQty.value,
    }

    const addition_info_shop_carts = buildCartAdjustments(cartStore.additionInfoShopCarts)

    if (addition_info_shop_carts.length > 0) {
      body.addition_info_shop_carts = addition_info_shop_carts
    }

    updateCart(body)
  },
  { debounce: 500, maxWait: 1000 },
)
</script>

<template>
  <ShopCartQuantityUi
    v-model:quantity="tempProductQty"
    :stock="props.productCart.inventory.stock"
    :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
  />
</template>
