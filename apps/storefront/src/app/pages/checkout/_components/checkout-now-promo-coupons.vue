<script setup lang="ts">
import { COUPON_CONFIG } from '@arc/enums/coupon'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { resolveCouponErrorMessage } from '~/domains/cart/utils/coupon-error'
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation'
import ShopCartPromoCouponsUi from '~/domains/cart/ui/shop-cart/shop-cart-promo-coupons-ui.vue'
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract'

const props = defineProps<{
  shopId: string
  shopName?: string
}>()

const cartStore = useCartStore()
const queryClient = useQueryClient()
const route = useRoute()

const tempCartId = route.query['c'] as string

const state = reactive({
  open: cartStore.stateCheckoutNow.promoCodes.length > 0,
  code: '',
  panelError: '',
})

const {
  mutateAsync: updateCart,
  isPending: isPendingUpdateCart,
} = useUpdateCart({
  onError: undefined,
})

const appliedCodes = computed(() => cartStore.stateCheckoutNow.promoCodes)
const isBusy = computed(() => isPendingUpdateCart.value)
const disabledAddBtn = computed(() => isBusy.value || !state.code.trim())
const disabledInput = computed(() => appliedCodes.value.length >= COUPON_CONFIG.MAX_USE_PER_ORDER)

// The inline panel alert is only meaningful while the popover is open, so a
// dismissed popover clears the previous failure instead of showing it stale.
watch(() => state.open, (isOpen) => {
  if (!isOpen) {
    state.panelError = ''
  }
})

function updateCacheSummaryOrder(summary: GetCartResponse['summary']) {
  queryClient.setQueryData<GetCartResponse>(['get-cart', tempCartId], (oldData) => {
    if (!oldData) return oldData
    return { ...oldData, summary }
  })
}

/**
 * Persists the accepted pending set in one pricing call. The API validates the
 * whole set, so a rejected combination leaves the cart untouched.
 */
async function acceptCodes(codes: string[]) {
  state.panelError = ''

  try {
    const { summary } = await updateCart({
      cart_id: tempCartId,
      addition_info_temp_cart: {
        promo_codes: codes,
      },
    })

    updateCacheSummaryOrder(summary)
    // Publishing the accepted codes refreshes the checkout quote watcher.
    cartStore.stateCheckoutNow.promoCodes = [...codes]
    state.code = ''
    state.open = false
  }
  catch (error) {
    // Failure keeps the staged selection and surfaces the reason in the panel.
    state.panelError = resolveCouponErrorMessage(error)
  }
}

async function removeCode(code: string) {
  const newPromoCodes = appliedCodes.value.filter(appliedCode => appliedCode !== code)

  try {
    const { summary } = await updateCart({
      cart_id: tempCartId,
      addition_info_temp_cart: {
        promo_codes: newPromoCodes,
      },
    })
    updateCacheSummaryOrder(summary)
    cartStore.stateCheckoutNow.promoCodes = newPromoCodes
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
    :cart-id="tempCartId"
    :codes="appliedCodes"
    :panel-error="state.panelError"
    :disabled="isBusy || cartStore.stateCheckoutNow.isPendingCreateOrder"
    :disabled-input="disabledInput"
    :disabled-add="disabledAddBtn"
    :is-applying="isBusy"
    @accept="acceptCodes"
    @remove-code="removeCode"
  />
</template>
