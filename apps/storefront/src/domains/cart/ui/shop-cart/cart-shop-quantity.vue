<script setup lang="ts">
import ShopCartQuantityUi from './shop-cart-quantity-ui.vue'
import { watchDebounced } from '@vueuse/core'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation'
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update'
import { buildCartAdjustments } from '~/domains/cart/utils/cart-adjustments'
import type { CartProductItem } from '~/domains/cart/api/cart.shared'
import type { GetCartResponse, UpdateCartRequest } from '~/domains/cart/api/contracts/cart.contract'

/**
 * Quantity stepper for one cart line.
 *
 * The PATCH is trailing-debounced so a burst of clicks renders locally and sends
 * one request. Only the newest request may write the cached cart: the response
 * echoes the whole priced cart, so a superseded response would otherwise roll the
 * row back to an older quantity.
 *
 * The server value is adopted only when the user has no unsent edit
 * (`confirmedQty`); otherwise the echoed quantity of an in-flight or superseded
 * request would fight the user's clicks.
 */
const props = defineProps<{
  productCart: CartProductItem
  shopId: string
}>()

const cartStore = useCartStore()
const queryClient = useQueryClient()

const tempProductQty = ref(props.productCart.quantity)

// Last quantity the server is known to hold for this line.
const confirmedQty = ref(props.productCart.quantity)

const {
  mutate: updateCart,
} = useUpdateCart()

// Newest dispatched request; its response is the only one allowed to update the
// cached cart, so responses that arrive out of order cannot stale-overwrite it.
let latestRequestId = 0

watch(
  () => props.productCart.quantity,
  (serverQty) => {
    if (serverQty === tempProductQty.value) {
      // The server caught up with the local edit.
      confirmedQty.value = serverQty
      return
    }

    // An edit the user has not finished sending wins over the echo.
    if (tempProductQty.value !== confirmedQty.value) return

    // No local edit pending: the server moved the quantity (stock clamp, merge,
    // another tab), so follow it.
    confirmedQty.value = serverQty
    tempProductQty.value = serverQty
  },
)

watchDebounced(
  tempProductQty,
  () => {
    // Adopting a server value re-triggers this watcher; nothing to send then.
    if (tempProductQty.value === props.productCart.quantity) return

    const body: UpdateCartRequest = {
      inventory_id: props.productCart.inventory.id,
      quantity: tempProductQty.value,
    }

    const addition_info_shop_carts = buildCartAdjustments(cartStore.additionInfoShopCarts)

    if (addition_info_shop_carts.length > 0) {
      body.addition_info_shop_carts = addition_info_shop_carts
    }

    const requestId = ++latestRequestId

    updateCart(body, {
      onSuccess: (data) => {
        if (requestId !== latestRequestId) return

        queryClient.setQueryData<GetCartResponse>(
          ['get-cart', 'my-cart'],
          oldData => applyPricedCartUpdate(oldData, data),
        )
      },
    })
  },
  { debounce: 500 },
)
</script>

<template>
  <ShopCartQuantityUi
    v-model:quantity="tempProductQty"
    :stock="props.productCart.inventory.stock"
    :disabled="cartStore.stateCheckoutCart.isPendingCreateOrder"
  />
</template>
