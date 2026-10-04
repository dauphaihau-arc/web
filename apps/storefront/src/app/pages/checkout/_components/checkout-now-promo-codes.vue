<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { PROMO_CODE_CONFIG } from '@arc/enums/promotion'
import { useCartStore } from '~/domains/cart/stores/cart.store'
import { resolvePromoCodeErrorMessage } from '~/domains/cart/utils/promo-code-error'
import { useUpdateCart } from '~/domains/cart/mutations/update-cart.mutation'
import ShopCartPromoCodesUi from '~/domains/cart/ui/shop-cart/shop-cart-promo-codes-ui.vue'
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

/**
 * Codes a refreshed checkout quote no longer accepted. They are gone from the
 * applied set, so this is the only place the buyer can still see them and learn
 * why the total changed.
 */
const removalNotices = computed(() => cartStore.promoCodeRemovalNotices.get(props.shopId) ?? [])

const removalNoticeText = computed(() =>
  removalNotices.value.map(notice => notice.message).join(' '))

function dismissRemovalNotices() {
  cartStore.promoCodeRemovalNotices.delete(props.shopId)
}

const disabledInput = computed(() => appliedCodes.value.length >= PROMO_CODE_CONFIG.MAX_USE_PER_ORDER)

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
    state.panelError = resolvePromoCodeErrorMessage(error)
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
    // open it so the message is actually visible where the promo code lives.
    state.panelError = 'Delete promo code failed'
    state.open = true
  }
}
</script>

<template>
  <div>
    <UAlert
      v-if="removalNotices.length > 0"
      class="mb-2"
      color="amber"
      variant="subtle"
      :ui="{ variant: { subtle: 'bg-state-warning-surface text-state-warning-text ring-1 ring-inset ring-state-warning-border' } }"
      :close-button="{
        icon: ICON_NAME_BY_ALIAS.xMarkSolid, color: 'gray', variant: 'link', padded: false,
      }"
      :description="removalNoticeText"
      @close="dismissRemovalNotices"
    />

    <ShopCartPromoCodesUi
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
  </div>
</template>
