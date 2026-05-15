<script lang="ts" setup>
import LoadingSvg from '~/shared/components/loading-svg.vue'
import { ROUTES } from '~/shared/config/enums/routes'
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status'
import { useGetOrderShopsByCheckoutSession } from '~/shared/services/order'

definePageMeta({ layout: 'market' })

const route = useRoute()
const cartStore = useCartStore()

const session_id = route.query['session_id'] as string

if (!session_id && cartStore.orderShops.length === 0) {
  throw showError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
    fatal: true,
  })
}

const {
  data: dataGetOrderShopsByCheckoutSession,
  isLoading: isLoadingGetOrderShopsByCheckoutSession,
  error: errorGetOrderShopsByCheckoutSession,
} = useGetOrderShopsByCheckoutSession(session_id, {
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

const orderShops = computed(() => {
  if (dataGetOrderShopsByCheckoutSession.value?.order_shops) {
    return dataGetOrderShopsByCheckoutSession.value.order_shops
  }
  else if (cartStore.orderShops.length > 0) {
    return cartStore.orderShops
  }
  return []
})

const isBackendWakingUp = computed(() => (
  !!errorGetOrderShopsByCheckoutSession.value
  && isBackendWakeUpError(errorGetOrderShopsByCheckoutSession.value)
))

onUnmounted(() => {
  if (cartStore.orderShops) {
    cartStore.orderShops = []
  }
})
</script>

<template>
  <div
    v-if="isLoadingGetOrderShopsByCheckoutSession && cartStore.orderShops.length === 0"
    class="grid h-[80vh] w-full place-content-center"
  >
    <LoadingSvg :child-class="'!w-12 !h-12'" />
  </div>
  <div
    v-else-if="isBackendWakingUp"
    class="grid h-[80vh] w-full place-content-center text-center"
  >
    <div class="space-y-3">
      <LoadingSvg :child-class="'!w-12 !h-12'" />
      <p class="text-sm text-zinc-600">
        The server is waking up. Please wait a moment.
      </p>
    </div>
  </div>
  <div
    v-else-if="orderShops.length > 0"
    class="mt-20 grid place-content-center text-center"
  >
    <div class="mb-4 text-center text-3xl font-medium">
      Your order is confirmed.
    </div>
    <div class=" space-y-4 text-zinc-600">
      <div>
        <span
          v-for="(item, idx) of orderShops"
          :key="idx"
        >
          <span v-if="idx > 0">, </span>
          <span class="underline underline-offset-2">
            {{ item.shop.shop_name }}
          </span>
        </span>
        will start working on this right away.<br>
        We'll email you as soon as it ships.
      </div>
      <div>
        <UButton
          size="lg"
          :to="ROUTES.ORDERS"
        >
          View your order
        </UButton>
      </div>
      <div class="">
        Delivery times are estimated. If you're experiencing difficulty with this order, please <br>
        <span class="underline underline-offset-2">contact the seller</span>. See <span class="underline underline-offset-2">more info</span>.
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
