<script lang="ts" setup>
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import { ROUTES } from '~/shared/config/enums/routes'
import { useGetCurrentUser } from '~/domains/me/queries/current-user.query'
import { useGetCheckoutOrderShopsByCheckoutSession } from '~/domains/checkout/queries/order-shops.query'
import { routes } from '~/shared/navigation/routes'
import { useLocalizedRoute } from '~/shared/composables/use-localized-route'

definePageMeta({ layout: 'market' })

const route = useRoute()
const cartStore = useCartStore()
const { localizePath } = useLocalizedRoute()
const { data: dataUserAuth } = useGetCurrentUser()

const session_id = route.query['session_id'] as string

// Not thrown: a throw from setup leaves the component without bindings, and Vue renders
// the template once anyway, so every binding read below would fail. showError marks the
// payload error and the app renders the 404 page in this page's place.
if (!session_id && cartStore.orderShops.length === 0) {
  showError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
  })
}

const {
  data: dataGetOrderShopsByCheckoutSession,
  isLoading: isLoadingGetOrderShopsByCheckoutSession,
  error: errorGetOrderShopsByCheckoutSession,
} = useGetCheckoutOrderShopsByCheckoutSession(session_id, {
  onResponseError: ({ response }) => {
    if ([502, 503, 504].includes(response.status)) {
      return
    }

    throw showError({
      statusCode: 404,
      statusMessage: 'Page Not Found',
      fatal: true,
    })
  },
})

const isAuthenticated = computed(() => !!dataUserAuth.value?.user)
const guestOrdersRoute = computed(() => {
  if (session_id) {
    return routes.guestOrders({ sessionId: session_id })
  }

  const orderIds = (route.query.order_ids as string | undefined)
    ?? cartStore.orderShops.map(orderShop => orderShop.order_number).join(',')
  const email = (route.query.guest_email as string | undefined)
    ?? cartStore.stateCheckoutCart.guestEmail
    ?? cartStore.stateCheckoutNow.guestEmail
  const zip = (route.query.guest_zip as string | undefined)
    ?? cartStore.stateCheckoutCart.address?.zip
    ?? cartStore.stateCheckoutNow.address?.zip

  return routes.guestOrders({
    ...(email ? { email } : {}),
    ...(orderIds ? { orderIds } : {}),
    ...(zip ? { zip } : {}),
  })
})

const orderLink = computed(() =>
  localizePath(isAuthenticated.value ? ROUTES.ORDERS : guestOrdersRoute.value))

const orderShops = computed(() => {
  if (dataGetOrderShopsByCheckoutSession.value?.order_shops) {
    return dataGetOrderShopsByCheckoutSession.value.order_shops
  }
  else if (cartStore.orderShops.length > 0) {
    return cartStore.orderShops
  }
  return []
})

const isUnknownError = computed(() => !!errorGetOrderShopsByCheckoutSession.value)

onUnmounted(() => {
  if (cartStore.orderShops) {
    cartStore.orderShops = []
  }
})
</script>

<template>
  <div class="mx-auto max-w-home-layout px-4 md:px-12 lg:px-16">
    <Empty
      v-if="isLoadingGetOrderShopsByCheckoutSession && cartStore.orderShops.length === 0"
      loading
      size="xl"
      variant="naked"
      container-class="h-[80vh] w-full"
    />
    <Empty
      v-else-if="isUnknownError"
      variant="naked"
      size="xl"
      :icon="ICON_NAME_BY_ALIAS['warning']"
      :title="$t('checkout.success.errorTitle')"
      :description="$t('checkout.success.errorDescription')"
      container-class="h-[80vh] w-full"
    />
    <div
      v-else-if="orderShops.length > 0"
      class="mt-20 grid place-content-center text-center"
    >
      <div class="mb-4 text-center text-3xl font-medium">
        {{ $t('checkout.success.title') }}
      </div>
      <div class=" space-y-4 text-text-subtle">
        <div>
          <i18n-t
            keypath="checkout.success.working"
            tag="div"
          >
            <template #shops>
              <span
                v-for="(item, idx) of orderShops"
                :key="idx"
              >
                <span v-if="idx > 0">, </span>
                <span class="underline underline-offset-2">
                  {{ item.shop.shop_name }}
                </span>
              </span>
            </template>
          </i18n-t>
          {{ $t('checkout.success.emailSoon') }}
        </div>
        <div>
          <UButton
            size="lg"
            :to="orderLink"
          >
            {{ isAuthenticated ? $t('checkout.success.viewOrder') : $t('checkout.success.trackOrder') }}
          </UButton>
        </div>
        <div class="">
          <i18n-t
            keypath="checkout.success.deliveryNotice"
            tag="span"
          >
            <template #contactSeller>
              <span class="underline underline-offset-2">{{ $t('checkout.success.contactSeller') }}</span>
            </template>
            <template #moreInfo>
              <span class="underline underline-offset-2">{{ $t('checkout.success.moreInfo') }}</span>
            </template>
          </i18n-t>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
