<script lang="ts" setup>
import PaymentOptions from '~/domains/checkout/ui/payment-options.vue'
import CheckoutAddressDialog from '~/domains/checkout/ui/checkout-address-dialog.vue'
import type { StateCheckoutCart, StateCheckoutNow } from '~/domains/cart/stores/cart.store.types'
import type { CheckoutQuoteResponse } from '~/domains/me/api/order/contracts/order.contract'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useGetUserAddresses } from '~/domains/me/queries/address/addresses.query'

const checkoutState = defineModel<StateCheckoutCart | StateCheckoutNow>('checkoutState', { required: true })
const props = withDefaults(defineProps<{
  /** Present once the server accepted a quote for this address. */
  quote?: CheckoutQuoteResponse | null
}>(), {
  quote: null,
})

const dialog = useModal()
const { t, locale } = useI18n()

const { data: dataUserAuth } = useGetCurrentUser()
const isAuthenticated = computed(() => !!dataUserAuth.value?.user)

const { data: dataUserAddress } = useGetUserAddresses()
const marketStore = useMarketStore()

const shippingRecalculatedNote = computed(() => {
  if (!props.quote) {
    return ''
  }

  const addressCountryCode = checkoutState.value.address?.country_code?.toUpperCase()
  const previewCountryCode = marketStore.previewCountryCode?.toUpperCase()

  if (!addressCountryCode || !previewCountryCode || addressCountryCode === previewCountryCode) {
    return ''
  }

  const country = checkoutState.value.address?.country ?? addressCountryCode
  const countryWithArticle = locale.value.toLowerCase().startsWith('en')
    && /^(United States|United Kingdom|United Arab Emirates|Netherlands|Philippines)$/i.test(country)
    ? `the ${country}`
    : country

  return t('checkout.review.shippingRecalculated', {
    country: countryWithArticle,
    preview: marketStore.activePreferences?.region ?? previewCountryCode,
  })
})

/**
 * Authenticated buyers who already saved an address do not have to pick one:
 * the default address (or the first saved one) becomes the shipping address, so
 * the review shows it directly. Guests start with nothing to show.
 */
watch(
  [isAuthenticated, () => dataUserAddress.value?.results],
  () => {
    if (!isAuthenticated.value || checkoutState.value.address) {
      return
    }

    const addresses = dataUserAddress.value?.results ?? []
    const preferred = addresses.find(address => address.is_primary) ?? addresses[0]

    if (preferred) {
      checkoutState.value.address = preferred
    }
  },
  { immediate: true },
)

const paymentType = computed({
  get: () => checkoutState.value.paymentType,
  set: (value) => {
    checkoutState.value.paymentType = value
  },
})

function changeAddress() {
  dialog.open(CheckoutAddressDialog, {
    checkoutState: checkoutState.value,
  })
}
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-6 md:flex-row md:gap-20">
      <div>
        <div class="mb-1 font-semibold">
          {{ t('checkout.review.shippingAddress') }}
        </div>

        <div
          v-if="checkoutState.address"
          class="my-2 flex flex-col"
        >
          <div class="">
            {{ checkoutState.address.full_name }}
          </div>
          <div class="">
            {{ checkoutState.address.address_1 }}
          </div>
          <div class="flex gap-2">
            <div>{{ checkoutState.address.city }}</div>
            <div>{{ checkoutState.address.zip }}</div>
          </div>
          <div class="">
            {{ checkoutState.address.country }}
          </div>
          <p
            v-if="shippingRecalculatedNote"
            class="mt-2 text-sm text-text-muted"
            data-testid="shipping-recalculated-note"
          >
            {{ shippingRecalculatedNote }}
          </p>
        </div>
        <div
          v-else
          class="my-2 text-sm text-text-muted"
        >
          {{ t('checkout.review.noAddress') }}
        </div>

        <UButton
          :padded="false"
          variant="link"
          :disabled="checkoutState.isPendingCreateOrder"
          @click="changeAddress"
        >
          {{ checkoutState.address ? t('checkout.review.changeAddress') : t('checkout.review.addAddress') }}
        </UButton>
      </div>

      <div>
        <div class="mb-1 font-semibold">
          {{ t('checkout.review.paymentMethod') }}
        </div>
        <PaymentOptions
          v-model="paymentType"
          direction="vertical"
          class="mt-2"
        />
      </div>
    </div>
  </UCard>
</template>
