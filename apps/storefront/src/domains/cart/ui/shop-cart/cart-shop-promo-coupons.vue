<script setup lang="ts">
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { resolveCouponErrorMessage } from '~/domains/cart/utils/coupon-error'
import { applyPricedCartUpdate } from '~/domains/cart/utils/apply-priced-cart-update'
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract'
import ShopCartPromoCouponsUi from './shop-cart-promo-coupons-ui.vue'

const props = defineProps<{
  shopId: string
  shopName?: string
}>()

const cartStore = useCartStore()
const queryClient = useQueryClient()

const {
  mutateAsync: updateCart,
  isPending: isPendingUpdateCart,
} = useUpdateCart({ onError: undefined })

const state = reactive({
  open: false,
  code: '',
  panelError: '',
})

const appliedCodes = computed(() => cartStore.additionInfoShopCarts.get(props.shopId)?.promoCodes ?? [])
const isBusy = computed(() => isPendingUpdateCart.value)
const disabledAddBtn = computed(() => !state.code.trim() || isBusy.value)

// The inline panel alert is only meaningful while the popover is open, so a
// dismissed popover clears the previous failure instead of showing it stale.
watch(() => state.open, (isOpen) => {
  if (!isOpen) {
    state.panelError = ''
  }
})

/**
 * Rebuilds the per-shop adjustment body from the store so a coupon change on
 * one shop never drops sibling shop selections. The shop being changed is
 * replaced with the code selection the API validated.
 */
function buildShopCarts(shopPromoCodes: string[]) {
  const next = new Map(cartStore.additionInfoShopCarts)
  next.set(props.shopId, {
    promoCodes: shopPromoCodes,
    note: next.get(props.shopId)?.note ?? '',
  })

  return Array.from(next)
    .map(([keyShopId, value]) => ({
      shop_id: keyShopId,
      promo_codes: value.promoCodes,
    }))
    .filter(item => item.promo_codes.length > 0)
}

/**
 * Persists the accepted selection only after the pricing call succeeded, then
 * mirrors the authoritative shipping and summary the server returned.
 */
function commitSelection(promo_codes: string[], data: GetCartResponse) {
  queryClient.setQueryData<GetCartResponse>(
    ['get-cart', 'my-cart'],
    oldData => applyPricedCartUpdate(oldData, data),
  )

  cartStore.additionInfoShopCarts.set(props.shopId, {
    promoCodes: [...promo_codes],
    note: cartStore.additionInfoShopCarts.get(props.shopId)?.note ?? '',
  })
}

/**
 * Persists the accepted pending set for the shop in one pricing call. The API
 * validates the whole set, so a rejected combination leaves the cart untouched.
 */
async function acceptCodes(codes: string[]) {
  state.panelError = ''

  try {
    const data = await updateCart({ addition_info_shop_carts: buildShopCarts(codes) })

    commitSelection(codes, data)
    state.code = ''
    state.open = false
  }
  catch (error) {
    // Failure keeps the staged selection and surfaces the reason in the panel.
    state.panelError = resolveCouponErrorMessage(error)
  }
}

async function removeCode(code: string) {
  const nextCodes = appliedCodes.value.filter(appliedCode => appliedCode !== code)
  try {
    const data = await updateCart({ addition_info_shop_carts: buildShopCarts(nextCodes) })
    commitSelection(nextCodes, data)
    state.panelError = ''
  }
  catch {
    // Surface the failure in the picker panel instead of a floating toast, and
    // open it so the message is actually visible where the coupon lives.
    state.panelError = 'Delete coupon failed'
    state.open = true
  }
}
</script>

<template>
  <ShopCartPromoCouponsUi
    v-model:code="state.code"
    v-model:open="state.open"
    :shop-id="props.shopId"
    :shop-name="props.shopName"
    :codes="appliedCodes"
    :panel-error="state.panelError"
    :disabled="isBusy"
    :disabled-add="disabledAddBtn"
    :is-applying="isBusy"
    @accept="acceptCodes"
    @remove-code="removeCode"
  />
</template>
