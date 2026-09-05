<script setup lang="ts">
import { StatusCodes } from 'http-status-codes'
import { FetchError } from 'ofetch'
import { COUPON_CONFIG } from '@arc/enums/coupon'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { toastCustom } from '~/shared/config/toast'
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation'
import ShopCartPromoCouponsUi from '~/domains/cart/ui/shop-cart/shop-cart-promo-coupons-ui.vue'
import type { GetCartResponse } from '~/domains/cart/api/contracts/cart.contract'

const toast = useToast()
const cartStore = useCartStore()
const queryClient = useQueryClient()
const route = useRoute()

const tempCartId = route.query['c'] as string

const state = reactive({
  showAddCouponInput: cartStore.stateCheckoutNow.promoCodes.length > 0,
  code: '',
  errorMsg: '',
})

const {
  mutateAsync: updateCart,
  isPending: isPendingUpdateCart,
} = useUpdateCart({
  onError: undefined,
})

async function addCoupon() {
  state.errorMsg = ''

  const errorMsg = cartStore.stateCheckoutNow.invalidCodes.get(state.code)
  if (errorMsg) {
    state.errorMsg = errorMsg
    return
  }
  const tempCodes = [...cartStore.stateCheckoutNow.promoCodes, state.code]

  try {
    const { summary } = await updateCart({
      cart_id: tempCartId,
      addition_info_temp_cart: {
        promo_codes: tempCodes,
      },
    })
    updateCacheSummaryOrder(summary)
    state.code = ''
    cartStore.stateCheckoutNow.promoCodes = tempCodes
  }
  catch (error) {
    if (error instanceof FetchError) {
      switch (error.status) {
        case StatusCodes.NOT_FOUND:
          state.errorMsg = 'Coupon code not found'
          cartStore.stateCheckoutNow.invalidCodes.set(state.code, state.errorMsg)
          break
        case StatusCodes.UNPROCESSABLE_ENTITY:
          toast.add({
            ...toastCustom.error,
            title: error.data.message,
          })
          break
        default:
          toast.add({
            ...toastCustom.error,
            title: 'Add coupon failed',
          })
      }
    }
  }
}

async function deleteCoupon(code: string) {
  const product = cartStore.stateCheckoutNow
  const newPromoCodes = product.promoCodes.filter(c => c !== code)

  try {
    const { summary } = await updateCart({
      cart_id: tempCartId,
      addition_info_temp_cart: {
        promo_codes: newPromoCodes,
      },
    })
    updateCacheSummaryOrder(summary)
    product.promoCodes = newPromoCodes
  }
  catch {
    toast.add({
      ...toastCustom.error,
      title: 'Delete coupon failed',
    })
  }
}

async function toggleShowAddCouponInput() {
  state.showAddCouponInput = !state.showAddCouponInput
  if (!state.showAddCouponInput) {
    const product = cartStore.stateCheckoutNow

    try {
      const { summary } = await updateCart({
        cart_id: tempCartId,
        addition_info_temp_cart: {
          promo_codes: [],
        },
      })
      updateCacheSummaryOrder(summary)
      product.promoCodes = []
    }
    catch {
      toast.add({
        ...toastCustom.error,
        title: 'Delete all coupons failed',
      })
    }
  }
}

function updateCacheSummaryOrder(summary: GetCartResponse['summary']) {
  queryClient.setQueryData<GetCartResponse>(['get-cart', tempCartId], (oldData) => {
    if (!oldData) return oldData
    return { ...oldData, summary }
  })
}

const disabledAddBtn = computed(() => {
  return isPendingUpdateCart.value
    || cartStore.stateCheckoutNow.promoCodes.includes(state.code)
    || !state.code
})

const disabledInput = computed(() => {
  return cartStore.stateCheckoutNow.promoCodes.length === COUPON_CONFIG.MAX_USE_PER_ORDER
})
</script>

<template>
  <ShopCartPromoCouponsUi
    v-model:code="state.code"
    v-model:show-input="state.showAddCouponInput"
    :codes="cartStore.stateCheckoutNow.promoCodes"
    :error="state.errorMsg"
    :disabled="isPendingUpdateCart || cartStore.stateCheckoutNow.isPendingCreateOrder"
    :disabled-input="disabledInput"
    :disabled-add="disabledAddBtn"
    @apply="addCoupon"
    @toggle="toggleShowAddCouponInput"
    @remove-code="deleteCoupon"
  />
</template>
