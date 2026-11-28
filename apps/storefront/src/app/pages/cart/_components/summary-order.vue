<script setup lang="ts">
import { formatMinorCurrency } from '@arc/utils'
import SummaryOrderCard from '~/domains/cart/ui/summary-order-card.vue'
import { useGetCart } from '~/domains/cart/queries/cart.query'
import { resolveCartShippingUnavailableKind } from '~/domains/cart/utils/shipping-unavailable-summary'
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

const unavailableQuantity = computed(
  () => dataGetCart.value?.summary.unavailable_quantity ?? 0,
)
const hasUnavailableItems = computed(() => unavailableQuantity.value > 0)
const unavailableKind = computed(() => resolveCartShippingUnavailableKind(
  (dataGetCart.value?.cart?.shop_groups ?? [])
    .flatMap(shopGroup => shopGroup.items)
    .filter(item => item.is_selected && item.shipping?.available === false)
    .map(item => item.shipping?.reason),
))
const unavailableNotice = computed(() => {
  const count = unavailableQuantity.value

  switch (unavailableKind.value) {
    case 'destination':
      return t(count === 1
        ? 'cart.summary.unavailableDestinationOne'
        : 'cart.summary.unavailableDestinationMany', { count })
    case 'currency':
      return t(count === 1
        ? 'cart.summary.unavailableCurrencyOne'
        : 'cart.summary.unavailableCurrencyMany', {
        count,
        currency: dataGetCart.value?.summary.currency ?? '',
      })
    case 'unavailable':
    default:
      return t(count === 1
        ? 'cart.summary.unavailableGenericOne'
        : 'cart.summary.unavailableGenericMany', { count })
  }
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

      <div
        v-if="hasUnavailableItems"
        class="text-sm text-state-danger-text"
        data-testid="cart-unavailable-notice"
      >
        {{ unavailableNotice }}
      </div>

      <UButton
        :disabled="isTotalOrderInvalid || hasUnavailableItems || dataGetCart?.summary.total_selected_quantity === 0"
        :color="hasUnavailableItems || isTotalOrderInvalid ? 'gray' : 'primary'"
        :ui="{
          rounded: 'shadow-border',
        }"
        block
        class="mx-auto"
        :class="hasUnavailableItems || isTotalOrderInvalid ? 'opacity-50' : ''"
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
