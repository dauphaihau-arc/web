<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import SummaryOrderCard from '~/domains/cart/ui/summary-order-card.vue'
import { useGetCart } from '~/domains/cart/queries/cart.query'
import { routes } from '~/shared/navigation/routes'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'

const {
  isPending: isPendingGetCart,
  data: dataGetCart,
} = useGetCart()
const router = useRouter()
const { localizePath } = useLocalizedRoute()
const { t } = useI18n()

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
    ? t('cart.summary.signInToCheckout')
    : t('cart.summary.proceedToCheckout')
})

function proceedToCheckout() {
  router.push(localizePath(routes.cartCheckout()))
}
</script>

<template>
  <SummaryOrderCard
    :loading="isPendingGetCart"
    :summary-order="dataGetCart?.summary"
  >
    <template #footer>
      <div
        v-if="isTotalOrderInvalid"
        class="text-state-danger-text"
      >
        {{ t('cart.summary.totalLimit', {
          amount: formatMinorCurrency(dataGetCart?.checkout_policy?.max_order_total_minor, dataGetCart?.summary.currency),
        }) }}
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
    </template>
  </SummaryOrderCard>
</template>

<style scoped>
</style>
