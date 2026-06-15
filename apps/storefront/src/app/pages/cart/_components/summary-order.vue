<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import { routes } from '~/shared/navigation/routes'

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()
const router = useRouter()

const isTotalOrderInvalid = computed(() => {
  const totalMinor = dataGetCart.value?.summary.total_minor
  const maxOrderTotalMinor = dataGetCart.value?.checkout_policy?.max_order_total_minor

  if (typeof totalMinor !== 'number' || typeof maxOrderTotalMinor !== 'number') {
    return false
  }

  return totalMinor > maxOrderTotalMinor
})

const proceedLabel = computed(() => {
  return dataGetCart.value?.requires_sign_in_for_checkout
    ? 'Sign in to checkout'
    : 'Proceed to checkout'
})

function proceedToCheckout() {
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
      class="text-state-danger-text"
    >
      The total amount due must be no more than
      {{ formatMinorCurrency(dataGetCart?.checkout_policy?.max_order_total_minor, dataGetCart?.summary.currency) }}
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
