<script setup lang="ts">
import { ORDER_CONFIG } from '~/shared/config/enums/order'
import RegisterLoginDialog from '~/app/components/dialogs/login-register/register-login-dialog.vue'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import { routes } from '~/shared/navigation/routes'
import { setPostAuthRedirect } from '~/shared/server-state/auth/post-auth-redirect'

const modal = useModal()
const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()
const router = useRouter()

const isTotalOrderInvalid = computed(() => {
  if (dataGetCart.value) {
    return !(dataGetCart.value.summary.total_price < ORDER_CONFIG.MAX_ORDER_TOTAL)
  }
  return true
})

const proceedLabel = computed(() => {
  return dataGetCart.value?.requires_sign_in_for_checkout
    ? 'Sign in to checkout'
    : 'Proceed to checkout'
})

function proceedToCheckout() {
  if (dataGetCart.value?.requires_sign_in_for_checkout) {
    setPostAuthRedirect('/cart/checkout')
    modal.open(RegisterLoginDialog)
    return
  }

  router.push(routes.cartCheckout())
}
</script>

<template>
  <div class="space-y-8">
    <SummaryOrderCard
      :loading="isPendingGetCart"
      :summary-order="dataGetCart?.summary"
    />
    <div
      v-if="isTotalOrderInvalid"
      class="text-red-500"
    >
      The total amount due must be no more than
      {{ formatCurrency(ORDER_CONFIG.MAX_ORDER_TOTAL) }}
    </div>

    <UButton
      :disabled="isTotalOrderInvalid || dataGetCart?.summary.total_selected_quantity === 0"
      :ui="{
        rounded: 'shadow-border',
      }"
      block
      class="mx-auto"
      size="xl"
      @click="proceedToCheckout()"
    >
      {{ proceedLabel }}
    </UButton>
  </div>
</template>

<style scoped>
</style>
