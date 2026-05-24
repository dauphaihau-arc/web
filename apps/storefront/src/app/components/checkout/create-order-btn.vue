<script setup lang="ts">
import { consola } from 'consola'
import { PaymentTypes } from '~/shared/config/enums/order'
import { MARKET_CONFIG } from '~/shared/config/enums/market'
import { toastCustom } from '~/shared/config/toast'
import { ROUTES } from '~/shared/config/enums/routes'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useCreateGuestOrderForBuyNow } from '~/shared/server-state/checkout/create-order-buy-now.mutation'
import { useCreateOrderForBuyNow } from '~/shared/server-state/me/orders/create-order-buy-now.mutation'
import { CheckoutNowSteps } from '~/shared/stores/cart/cart.store.types'
import { useGetExchangeRates } from '~/shared/server-state/market/exchange-rates.query'
import type { CreateGuestOrderForBuyNowRequest } from '~/shared/api/checkout/contracts/checkout.contract'
import type { CreateOrderForBuyNowRequest } from '~/shared/api/me/order/contracts/order.contract'
import type { ExchangeRatesResponse as ResponseGetExchangeRates } from '~/shared/api/market/contracts/market.contract'

const cartStore = useCartStore()
const toast = useToast()
const marketStore = useMarketStore()
const { data: dataUserAuth } = useGetCurrentUser()

const route = useRoute()
const tempCartId = route.query['c'] as string

const {
  mutateAsync: createOrder,
} = useCreateOrderForBuyNow()
const {
  mutateAsync: createGuestOrder,
} = useCreateGuestOrderForBuyNow()

const {
  refetch: refetchGetExchangeRates,
} = useGetExchangeRates({
  enabled: false,
})

const onCreateOrder = async () => {
  try {
    cartStore.stateCheckoutNow.isPendingCreateOrder = true

    const address = cartStore.stateCheckoutNow.address

    if (!address) {
      consola.error('addressId be undefined')
      throw new Error()
    }

    const isAuthenticated = !!dataUserAuth.value?.user
    const body: CreateOrderForBuyNowRequest | CreateGuestOrderForBuyNowRequest = isAuthenticated
      ? {
          cart_id: tempCartId,
          payment_type: cartStore.stateCheckoutNow.paymentType,
          user_address_id: 'id' in address ? address.id : '',
        }
      : {
          cart_id: tempCartId,
          payment_type: cartStore.stateCheckoutNow.paymentType,
          guest: {
            email: cartStore.stateCheckoutNow.guestEmail,
          },
          shipping_address: {
            full_name: address.full_name,
            address_1: address.address_1,
            address_2: address.address_2,
            city: address.city,
            country: address.country,
            state: address.state,
            zip: address.zip,
            phone: address.phone,
          },
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
      const { checkout_session_url } = isAuthenticated
        ? await createOrder(body as CreateOrderForBuyNowRequest)
        : await createGuestOrder(body as CreateGuestOrderForBuyNowRequest)
      if (!checkout_session_url) {
        consola.error('checkout_session_url be undefined', checkout_session_url)
        throw new Error()
      }
      navigateTo(checkout_session_url, {
        external: true,
      })
    }
    else {
      const { order_shops } = isAuthenticated
        ? await createOrder(body as CreateOrderForBuyNowRequest)
        : await createGuestOrder(body as CreateGuestOrderForBuyNowRequest)
      cartStore.orderShops = order_shops
      const guestOrderIds = order_shops.map(orderShop => orderShop.id).join(',')
      navigateTo(isAuthenticated
        ? ROUTES.SUCCESS
        : routes.success({
          guestEmail: cartStore.stateCheckoutNow.guestEmail,
          orderIds: guestOrderIds,
        }))
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
        cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.ADDRESS_SHIPPING
          || cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.PAYMENT
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
      v-else-if="cartStore.stateCheckoutNow.currentStep === CheckoutNowSteps.REVIEW_CONFIRMATION"
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
