<script setup lang="ts">
import { consola } from 'consola'
import { CheckoutCartSteps } from '~/shared/stores/cart/cart.store.types'
import { PaymentTypes } from '~/shared/config/enums/order'
import { MARKET_CONFIG } from '~/shared/config/enums/market'
import { toastCustom } from '~/shared/config/toast'
import { ROUTES } from '~/shared/config/enums/routes'
import { useCreateOrderFromCart } from '~/shared/server-state/me/orders/create-order-from-cart.mutation'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { useGetExchangeRates } from '~/shared/server-state/market/exchange-rates.query'
import type { CreateOrderFromCartRequest } from '~/shared/api/me/order/contracts/order.contract'
import { useGetCart } from '~/shared/server-state/me/cart/cart.query'
import type { ExchangeRatesResponse as ResponseGetExchangeRates } from '~/shared/api/market/contracts/market.contract'

const marketStore = useMarketStore()
const toast = useToast()
const cartStore = useCartStore()

const {
  refetch: getCart,
} = useGetCart(undefined, { enabled: false })

const {
  mutateAsync: createOrder,
} = useCreateOrderFromCart()

const {
  refetch: refetchGetExchangeRates,
} = useGetExchangeRates({
  enabled: false,
})

const onCreateOrder = async () => {
  try {
    cartStore.stateCheckoutCart.isPendingCreateOrder = true

    const addressId = cartStore.stateCheckoutCart.address?.id
    if (!addressId) {
      consola.error('addressId be undefined')
      throw Error()
    }

    const body: CreateOrderFromCartRequest = {
      payment_type: cartStore.stateCheckoutCart.paymentType,
      user_address_id: addressId,
    }

    // region validate currency
    const currencySelected = marketStore.guestPreferences?.currency || MARKET_CONFIG.BASE_CURRENCY
    if (!marketStore.exchangeRate?.rates) {
      consola.error('currency or rates be undefined', [currencySelected, marketStore.exchangeRate.rates])
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
      cartStore.stateCheckoutCart.isPendingCreateOrder = false
      cartStore.stateCheckoutCart.countRefreshConvertCurrency++
      return
    }
    // endregion validate currency

    let tempAdditionInfoShopCarts = Array
      .from(cartStore.additionInfoShopCarts)
      .map(([shopId, value]) => ({
        shop_id: shopId,
        promo_codes: value.promoCodes,
        note: value.note,
      }))

    tempAdditionInfoShopCarts = tempAdditionInfoShopCarts.filter((item) => {
      return item.note || item.promo_codes.length > 0
    })
    if (tempAdditionInfoShopCarts.length > 0) {
      body.addition_info_shop_carts = tempAdditionInfoShopCarts
    }

    if (body.payment_type === PaymentTypes.CARD) {
      const { checkout_session_url } = await createOrder(body)
      if (!checkout_session_url) {
        consola.error('checkout_session_url be undefined', checkout_session_url)
        throw Error()
      }
      navigateTo(checkout_session_url, {
        external: true,
      })
    }
    else {
      const { order_shops } = await createOrder(body)
      cartStore.orderShops = order_shops
      navigateTo(ROUTES.SUCCESS)
      getCart()
    }
  }
  catch (error) {
    cartStore.stateCheckoutCart.isPendingCreateOrder = false
    toast.add({
      ...toastCustom.error,
      title: 'Create order failed',
    })
  }
}

function nextStep() {
  cartStore.stateCheckoutCart.currentStep++
}
</script>

<template>
  <div class="mx-auto mt-8">
    <UButton
      v-if="
        cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.ADDRESS_SHIPPING
          || cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.PAYMENT
      "
      block
      size="xl"
      :disabled="!cartStore.stateCheckoutCart.address"
      :ui="{ rounded: 'shadow-border' }"
      @click="nextStep"
    >
      Continue
    </UButton>
    <UButton
      v-else-if="cartStore.stateCheckoutCart.currentStep === CheckoutCartSteps.REVIEW_CONFIRMATION"
      block
      size="xl"
      :loading="cartStore.stateCheckoutCart.isPendingCreateOrder"
      :ui="{ rounded: 'shadow-border' }"
      @click="onCreateOrder"
    >
      Complete Order
    </UButton>
  </div>
</template>

<style scoped>

</style>
