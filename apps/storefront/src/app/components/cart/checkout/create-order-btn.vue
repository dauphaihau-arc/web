<script setup lang="ts">
import { consola } from 'consola'
import { PaymentTypes } from '@arc/enums/order'
import { MARKET_CONFIG } from '@arc/enums/market'
import { CheckoutCartSteps } from '~/shared/stores/cart/cart.store.types'
import { toastCustom } from '~/shared/config/toast'
import { ROUTES } from '~/shared/config/enums/routes'
import { routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useCreateGuestOrderFromCart } from '~/shared/server-state/checkout/create-order-from-cart.mutation'
import { useCreateOrderFromCart } from '~/shared/server-state/me/orders/create-order-from-cart.mutation'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { useGetExchangeRates } from '~/shared/server-state/market/exchange-rates.query'
import type { CreateGuestOrderFromCartRequest } from '~/shared/api/checkout/contracts/checkout.contract'
import type { CreateOrderFromCartRequest } from '~/shared/api/me/order/contracts/order.contract'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import type { ExchangeRatesResponse as ResponseGetExchangeRates } from '~/shared/api/market/contracts/market.contract'

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
  mutateAsync: createGuestOrder,
} = useCreateGuestOrderFromCart()

const {
  refetch: refetchGetExchangeRates,
} = useGetExchangeRates({
  enabled: false,
})

const onCreateOrder = async () => {
  try {
    cartStore.stateCheckoutCart.isPendingCreateOrder = true

    const address = cartStore.stateCheckoutCart.address
    if (!address) {
      consola.error('addressId be undefined')
      throw Error()
    }

    const isAuthenticated = !!dataUserAuth.value?.user
    const body: CreateOrderFromCartRequest | CreateGuestOrderFromCartRequest = isAuthenticated
      ? {
          payment_type: cartStore.stateCheckoutCart.paymentType,
          user_address_id: 'id' in address ? address.id : '',
        }
      : {
          payment_type: cartStore.stateCheckoutCart.paymentType,
          guest: {
            email: cartStore.stateCheckoutCart.guestEmail,
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
      const { checkout_session_url } = isAuthenticated
        ? await createOrder(body as CreateOrderFromCartRequest)
        : await createGuestOrder(body as CreateGuestOrderFromCartRequest)
      if (!checkout_session_url) {
        consola.error('checkout_session_url be undefined', checkout_session_url)
        throw Error()
      }
      navigateTo(checkout_session_url, {
        external: true,
      })
    }
    else {
      const { order_shops } = isAuthenticated
        ? await createOrder(body as CreateOrderFromCartRequest)
        : await createGuestOrder(body as CreateGuestOrderFromCartRequest)
      cartStore.orderShops = order_shops
      const guestOrderIds = order_shops.map(orderShop => orderShop.id).join(',')
      navigateTo(isAuthenticated
        ? ROUTES.SUCCESS
        : routes.success({
          guestEmail: cartStore.stateCheckoutCart.guestEmail,
          guestZip: cartStore.stateCheckoutCart.address?.zip,
          orderIds: guestOrderIds,
        }))
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
