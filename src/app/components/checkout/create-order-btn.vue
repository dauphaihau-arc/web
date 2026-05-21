<script setup lang="ts">
import { consola } from 'consola'
import { PaymentTypes } from '~/shared/config/enums/order'
import { MARKET_CONFIG } from '~/shared/config/enums/market'
import { toastCustom } from '~/shared/config/toast'
import { ROUTES } from '~/shared/config/enums/routes'
import { useCartStore } from '~/shared/stores/cart'
import { useCreateOrderForBuyNow } from '~/shared/server-state/me/orders/create-order-buy-now.mutation'
import { CheckoutNowSteps } from '~/shared/checkout/checkout.types'
import { useGetExchangeRates } from '~/shared/server-state/market/exchange-rates.query'
import type { CreateOrderForBuyNowRequest } from '~/shared/api/me/orders/create-order-buy-now'
import type { Cart } from '~/shared/models/cart'
import type { ExchangeRatesResponse as ResponseGetExchangeRates } from '~/shared/market/market.types'

const cartStore = useCartStore()
const toast = useToast()
const marketStore = useMarketStore()

const route = useRoute()
const tempCartId = route.query['c'] as Cart['id']

const {
  mutateAsync: createOrder,
} = useCreateOrderForBuyNow()

const {
  refetch: refetchGetExchangeRates,
} = useGetExchangeRates({
  enabled: false,
})

const onCreateOrder = async () => {
  try {
    cartStore.stateCheckoutNow.isPendingCreateOrder = true

    const addressId = cartStore.stateCheckoutNow.address?.id

    if (!addressId) {
      consola.error('addressId be undefined')
      throw new Error()
    }

    const body: CreateOrderForBuyNowRequest = {
      cart_id: tempCartId,
      payment_type: cartStore.stateCheckoutNow.paymentType,
      user_address_id: addressId,
    }
    if (cartStore.stateCheckoutNow.promoCodes.length > 0) {
      body.promo_codes = cartStore.stateCheckoutNow.promoCodes
    }
    if (cartStore.stateCheckoutNow.note) {
      body.note = cartStore.stateCheckoutNow.note
    }

    // region validate currency
    const currencySelected = marketStore.guestPreferences?.currency || MARKET_CONFIG.BASE_CURRENCY
    if (!marketStore.exchangeRate?.rates) {
      consola.error('currency or rates be undefined')
      throw Error()
    }
    body.currency = currencySelected

    const ratePrev = marketStore.exchangeRate.rates[currencySelected]

    const { data: exchangeRates }: { data: ResponseGetExchangeRates | undefined } = await refetchGetExchangeRates()

    if (!exchangeRates?.rates) {
      consola.error('new rates be undefined')
      throw Error()
    }
    const rateNew = exchangeRates.rates[currencySelected]

    if (ratePrev !== rateNew) {
      toast.add({
        ...toastCustom.info,
        title: 'Currency have a update, please recheck',
      })
      cartStore.stateCheckoutNow.isPendingCreateOrder = false
      cartStore.stateCheckoutNow.countRefreshConvertCurrency++
      return
    }
    // endregion validate currency

    if (body.payment_type === PaymentTypes.CARD) {
      const { checkout_session_url } = await createOrder(body)
      if (!checkout_session_url) {
        consola.error('checkout_session_url be undefined', checkout_session_url)
        throw new Error()
      }
      navigateTo(checkout_session_url, {
        external: true,
      })
    }
    else {
      const { order_shops } = await createOrder(body)
      cartStore.orderShops = order_shops
      navigateTo(ROUTES.SUCCESS)
    }
  }
  catch (error) {
    cartStore.stateCheckoutNow.isPendingCreateOrder = false
    toast.add({
      ...toastCustom.error,
      title: 'Create order failed',
    })
  }
}

function nextStep() {
  cartStore.stateCheckoutNow.currentStep++
}
</script>

<template>
  <div class="mx-auto mt-8">
    <UButton
      v-if="
        cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.addressShipping
          || cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.payment
      "
      block
      size="xl"
      :disabled="!cartStore.stateCheckoutNow.address"
      :ui="{ rounded: 'shadow-border' }"
      @click="nextStep"
    >
      Continue
    </UButton>
    <UButton
      v-else-if="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.reviewConfirmation"
      block
      size="xl"
      :loading="cartStore.stateCheckoutNow.isPendingCreateOrder"
      :ui="{ rounded: 'shadow-border' }"
      @click="onCreateOrder"
    >
      Complete Order
    </UButton>
  </div>
</template>

<style scoped>

</style>
