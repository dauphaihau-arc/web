<script setup lang="ts">
import { ORDER_CONFIG } from '@arc/enums/order'
import { toMinorUnits } from '@arc/utils'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import { routes } from '~/shared/navigation/routes'

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()
const router = useRouter()

const isTotalOrderInvalid = computed(() => {
  if (dataGetCart.value) {
    const currency = dataGetCart.value.summary.currency
    return !(dataGetCart.value.summary.total_minor < toMinorUnits(ORDER_CONFIG.MAX_ORDER_TOTAL, currency))
  }
  return true
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
