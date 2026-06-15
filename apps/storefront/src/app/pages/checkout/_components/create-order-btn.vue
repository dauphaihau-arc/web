<script setup lang="ts">
import { consola } from 'consola'
import { PaymentTypes } from '@arc/enums/order'
import { MARKET_CONFIG } from '@arc/enums/market'
import { FetchError } from 'ofetch'
import { toastCustom } from '~/shared/config/toast'
import { ROUTES } from '~/shared/config/enums/routes'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import { routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useCreateGuestCheckoutQuoteForBuyNow } from '~/shared/server-state/checkout/create-checkout-quote-buy-now.mutation'
import { useCreateGuestOrderForBuyNow } from '~/shared/server-state/checkout/create-order-buy-now.mutation'
import { useCreateCheckoutQuoteForBuyNow } from '~/shared/server-state/me/orders/create-checkout-quote-buy-now.mutation'
import { useCreateOrderForBuyNow } from '~/shared/server-state/me/orders/create-order-buy-now.mutation'
import { CheckoutNowSteps } from '~/shared/stores/cart/cart.store.types'
import type {
  CreateGuestCheckoutQuoteForBuyNowRequest,
  CreateGuestOrderForBuyNowRequest,
} from '~/shared/api/checkout/contracts/checkout.contract'
import type {
  CreateCheckoutQuoteForBuyNowRequest,
  CreateOrderForBuyNowRequest,
} from '~/shared/api/me/order/contracts/order.contract'
import { getBackendErrorMessage } from '~/shared/utils/backend-error'

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
  mutateAsync: createQuote,
} = useCreateCheckoutQuoteForBuyNow()
const {
  mutateAsync: createGuestQuote,
} = useCreateGuestCheckoutQuoteForBuyNow()

const onCreateOrder = async () => {
  try {
    cartStore.stateCheckoutNow.isPendingCreateOrder = true

    const address = cartStore.stateCheckoutNow.address

    if (!address) {
      consola.error('addressId be undefined')
      throw new Error()
    }

    const isAuthenticated = !!dataUserAuth.value?.user
    const quoteBody: CreateCheckoutQuoteForBuyNowRequest | CreateGuestCheckoutQuoteForBuyNowRequest = isAuthenticated
      ? {
          cart_id: tempCartId,
          user_address_id: 'id' in address ? address.id : '',
        }
      : {
          cart_id: tempCartId,
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
      quoteBody.promo_codes = cartStore.stateCheckoutNow.promoCodes
    }
    if (cartStore.stateCheckoutNow.note) {
      quoteBody.note = cartStore.stateCheckoutNow.note
    }

    if (!isAuthenticated) {
      const currencySelected = marketStore.guestPreferences?.currency || MARKET_CONFIG.BASE_CURRENCY
      quoteBody.presentment_currency = currencySelected
    }

    const { quote_id } = isAuthenticated
      ? await createQuote(quoteBody as CreateCheckoutQuoteForBuyNowRequest)
      : await createGuestQuote(quoteBody as CreateGuestCheckoutQuoteForBuyNowRequest)

    const orderBody: CreateOrderForBuyNowRequest | CreateGuestOrderForBuyNowRequest = isAuthenticated
      ? {
          payment_type: cartStore.stateCheckoutNow.paymentType,
          quote_id,
        }
      : {
          payment_type: cartStore.stateCheckoutNow.paymentType,
          quote_id,
          guest: {
            email: cartStore.stateCheckoutNow.guestEmail,
          },
        }

    if (orderBody.payment_type === PaymentTypes.CARD) {
      const { checkout_session_url } = isAuthenticated
        ? await createOrder(orderBody as CreateOrderForBuyNowRequest)
        : await createGuestOrder(orderBody as CreateGuestOrderForBuyNowRequest)
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
        ? await createOrder(orderBody as CreateOrderForBuyNowRequest)
        : await createGuestOrder(orderBody as CreateGuestOrderForBuyNowRequest)

      cartStore.orderShops = order_shops

      const guestOrderIds = order_shops.map(orderShop => orderShop.order_number).join(',')

      navigateTo(isAuthenticated
        ? ROUTES.SUCCESS
        : routes.success({
          guestEmail: cartStore.stateCheckoutNow.guestEmail,
          guestZip: cartStore.stateCheckoutNow.address?.zip,
          orderIds: guestOrderIds,
        }))
    }
  }
  catch (error) {
    cartStore.stateCheckoutNow.isPendingCreateOrder = false
    const backendMessage = getBackendErrorMessage(error)

    toast.add({
      ...toastCustom.error,
      title: backendMessage ?? 'Create order failed',
      ...(error instanceof FetchError && !backendMessage
        ? { description: `Request failed with status ${error.status ?? 'unknown'}` }
        : {}),
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
