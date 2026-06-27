<script setup lang="ts">
import { consola } from 'consola'
import { PaymentTypes } from '@arc/enums/order'
import { MARKET_CONFIG } from '@arc/enums/market'
import { FetchError } from 'ofetch'
import { CheckoutCartSteps } from '~/shared/stores/cart/cart.store.types'
import { toastCustom } from '~/shared/config/toast'
import { ROUTES } from '~/shared/config/enums/routes'
import { routes } from '~/shared/navigation/routes'
import { useGetCurrentUser } from '~/shared/server-state/me/current-user.query'
import { useCreateGuestCheckoutQuoteFromCart } from '~/shared/server-state/checkout/create-checkout-quote-from-cart.mutation'
import { useCreateGuestOrderFromCart } from '~/shared/server-state/checkout/create-order-from-cart.mutation'
import { useCreateCheckoutQuoteFromCart } from '~/shared/server-state/me/orders/create-checkout-quote-from-cart.mutation'
import { useCreateOrderFromCart } from '~/shared/server-state/me/orders/create-order-from-cart.mutation'
import { useCartStore } from '~/shared/stores/cart/cart.store'
import type {
  CreateGuestCheckoutQuoteFromCartRequest,
  CreateGuestOrderFromCartRequest,
} from '~/shared/api/checkout/contracts/checkout.contract'
import type {
  CreateCheckoutQuoteFromCartRequest,
  CreateOrderFromCartRequest,
} from '~/shared/api/me/order/contracts/order.contract'
import { useGetCart } from '~/shared/server-state/cart/cart.query'
import { getBackendErrorMessage } from '~/shared/utils/backend-error'
import { getCheckoutFailureCopy, resolveCheckoutFailure } from '~/shared/utils/checkout-error'

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
  mutateAsync: createQuote,
} = useCreateCheckoutQuoteFromCart()
const {
  mutateAsync: createGuestQuote,
} = useCreateGuestCheckoutQuoteFromCart()

const onCreateOrder = async () => {
  try {
    cartStore.stateCheckoutCart.isPendingCreateOrder = true

    const address = cartStore.stateCheckoutCart.address
    if (!address) {
      consola.error('addressId be undefined')
      throw Error()
    }

    const isAuthenticated = !!dataUserAuth.value?.user
    const quoteBody: CreateCheckoutQuoteFromCartRequest | CreateGuestCheckoutQuoteFromCartRequest = isAuthenticated
      ? {
          user_address_id: 'id' in address ? address.id : '',
        }
      : {
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

    if (!isAuthenticated) {
      const currencySelected = marketStore.guestPreferences?.currency || MARKET_CONFIG.BASE_CURRENCY
      quoteBody.presentment_currency = currencySelected
    }

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
      quoteBody.addition_info_shop_carts = tempAdditionInfoShopCarts
    }

    const { quote_id } = isAuthenticated
      ? await createQuote(quoteBody as CreateCheckoutQuoteFromCartRequest)
      : await createGuestQuote(quoteBody as CreateGuestCheckoutQuoteFromCartRequest)

    const orderBody: CreateOrderFromCartRequest | CreateGuestOrderFromCartRequest = isAuthenticated
      ? {
          payment_type: cartStore.stateCheckoutCart.paymentType,
          quote_id,
        }
      : {
          payment_type: cartStore.stateCheckoutCart.paymentType,
          quote_id,
          guest: {
            email: cartStore.stateCheckoutCart.guestEmail,
          },
        }

    if (orderBody.payment_type === PaymentTypes.CARD) {
      const { checkout_session_url } = isAuthenticated
        ? await createOrder(orderBody as CreateOrderFromCartRequest)
        : await createGuestOrder(orderBody as CreateGuestOrderFromCartRequest)
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
        ? await createOrder(orderBody as CreateOrderFromCartRequest)
        : await createGuestOrder(orderBody as CreateGuestOrderFromCartRequest)
      cartStore.orderShops = order_shops
      const guestOrderIds = order_shops.map(orderShop => orderShop.order_number).join(',')
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
    const checkoutFailure = resolveCheckoutFailure(error)
    const checkoutFailureCopy = getCheckoutFailureCopy(checkoutFailure)

    if (checkoutFailure !== 'unknown') {
      await getCart()
    }

    const backendMessage = getBackendErrorMessage(error)

    toast.add({
      ...toastCustom.error,
      title: checkoutFailureCopy.title,
      description: checkoutFailureCopy.description
        ?? (error instanceof FetchError && !backendMessage
          ? `Request failed with status ${error.status ?? 'unknown'}`
          : undefined),
      ...(checkoutFailure === 'unknown' && backendMessage
        ? { title: backendMessage }
        : {}),
      ...(error instanceof FetchError && !backendMessage
        && checkoutFailure === 'unknown'
        ? { description: `Request failed with status ${error.status ?? 'unknown'}` }
        : {}),
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
