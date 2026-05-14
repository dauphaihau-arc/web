<script setup lang="ts">
import { consola } from 'consola'
import { CHECKOUT_CART_STEPS } from '~/types/pages/cart/checkout'
import { PAYMENT_TYPES } from '~/config/enums/order'
import { toastCustom } from '~/config/toast'
import { ROUTES } from '~/config/enums/routes'
import { useCreateOrderFromCart } from '~/services/order'
import { useCartStore } from '~/stores/cart'
import { useGetExchangeRates } from '~/services/market'
import { useGetCurrentUser } from '~/services/user'
import type { CreateOrderFromCartBody } from '~/types/request-api/order'
import { useGetCart } from '~/services/cart'

const marketStore = useMarketStore()
const toast = useToast()
const cartStore = useCartStore()
const { data: dataUserAuth } = useGetCurrentUser()

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

    const body: CreateOrderFromCartBody = {
      payment_type: cartStore.stateCheckoutCart.payment_type,
      user_address_id: addressId,
    }

    // region validate currency
    const currencySelected = dataUserAuth?.value?.user?.market_preferences?.currency
    if (!currencySelected || !marketStore.exchangeRate?.rates) {
      consola.error('currency or rates be undefined', [currencySelected, marketStore.exchangeRate.rates])
      throw Error()
    }
    body.currency = currencySelected

    const ratePrev = marketStore.exchangeRate.rates[currencySelected]
    const {
      data: exchangeRates,
    } = await refetchGetExchangeRates()

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
        promo_codes: value.promo_codes,
        note: value.note,
      }))

    tempAdditionInfoShopCarts = tempAdditionInfoShopCarts.filter((item) => {
      return item.note || item.promo_codes.length > 0
    })
    if (tempAdditionInfoShopCarts.length > 0) {
      body.addition_info_shop_carts = tempAdditionInfoShopCarts
    }

    if (body.payment_type === PAYMENT_TYPES.CARD) {
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
        cartStore.stateCheckoutCart.currentStep === CHECKOUT_CART_STEPS.ADDRESS_SHIPPING
          || cartStore.stateCheckoutCart.currentStep === CHECKOUT_CART_STEPS.PAYMENT
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
      v-else-if="cartStore.stateCheckoutCart.currentStep === CHECKOUT_CART_STEPS.REVIEW_CONFIRMATION"
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
