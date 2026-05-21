<script setup lang="ts">
import { StatusCodes } from 'http-status-codes'
import { FetchError } from 'ofetch'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { toastCustom } from '~/shared/config/toast'
import { COUPON_CONFIG } from '~/shared/config/enums/coupon'
import { useUpdateCart } from '~/shared/server-state/cart/update-cart.mutation'
import type { GetCartResponse } from '~/shared/api/cart/contracts/cart.contract'

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
  catch (error) {
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
    catch (error) {
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
  <UButton
    variant="ghost"
    icon="i-heroicons-ticket"
    color="gray"
    class="w-fit"
    :disabled="cartStore.stateCheckoutNow.isPendingCreateOrder"
    @click="toggleShowAddCouponInput"
  >
    Apply shop coupon codes
  </UButton>

  <div
    v-if="state.showAddCouponInput"
    class="mb-4 flex gap-3"
  >
    <UFormGroup
      required
      name="code"
      :error="state.errorMsg"
    >
      <UButtonGroup
        size="lg"
        orientation="horizontal"
      >
        <UInput
          v-model="state.code"
          v-uppercase
          :disabled="disabledInput || cartStore.stateCheckoutNow.isPendingCreateOrder"
        />
        <UButton
          color="gray"
          variant="solid"
          :disabled="disabledAddBtn || cartStore.stateCheckoutNow.isPendingCreateOrder"
          @click="addCoupon"
        >
          Add
        </UButton>
      </UButtonGroup>
    </UFormGroup>

    <div
      v-if="cartStore.stateCheckoutNow.promoCodes.length > 0"
      class="flex gap-3"
    >
      <div
        v-for="(code, index) of cartStore.stateCheckoutNow.promoCodes"
        :key="index"
      >
        <div class="relative">
          <UButton
            color="gray"
            size="lg"
          >
            {{ code }}
          </UButton>
          <UButton
            class="absolute -right-2 -top-3 z-[1]"
            size="2xs"
            color="gray"
            variant="solid"
            :disabled="isPendingUpdateCart || cartStore.stateCheckoutNow.isPendingCreateOrder"
            icon="i-heroicons-x-mark-20-solid"
            :ui="{ rounded: 'rounded-full' }"
            @click="() => deleteCoupon(code)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
