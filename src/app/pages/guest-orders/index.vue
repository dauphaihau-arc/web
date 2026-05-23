<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import ShopItem from '~/app/components/order/shop-item/shop-item.vue'
import { useLookupGuestOrders } from '~/shared/server-state/checkout/guest-orders.query'
import { routes } from '~/shared/navigation/routes'
import { isBackendWakeUpError } from '~/shared/composables/use-backend-status'

definePageMeta({ layout: 'market' })

const route = useRoute()
const router = useRouter()
const hasDirectLookup = computed(() => !!route.query.session_id || !!route.query.token)

const state = reactive({
  email: (route.query.email as string | undefined) ?? '',
  order_id: (route.query.order_id as string | undefined) ?? '',
  zip: (route.query.zip as string | undefined) ?? '',
})

const lookupParams = computed(() => ({
  email: state.email || undefined,
  order_id: state.order_id || undefined,
  order_ids: route.query.order_ids as string | undefined,
  session_id: route.query.session_id as string | undefined,
  token: route.query.token as string | undefined,
  zip: state.zip || undefined,
}))

const {
  data,
  error,
  isLoading,
  refetch,
} = useLookupGuestOrders(lookupParams, {
  onResponseError: ({ response }) => {
    if ([502, 503, 504].includes(response.status)) {
      return
    }
  },
})

const orderShops = computed(() => data.value?.order_shops ?? [])

const isBackendWakingUp = computed(() => (
  !!error.value && isBackendWakeUpError(error.value)
))

onMounted(async () => {
  if (
    route.query.token
    || (
      route.query.session_id
    )
    || (
      route.query.email
      && (route.query.order_id || route.query.order_ids)
      && route.query.zip
    )
  ) {
    await refetch()
  }
})

async function onSubmit(_: FormSubmitEvent<{ email: string, order_id: string, zip: string }>) {
  await router.push(routes.guestOrders({
    email: state.email,
    orderId: state.order_id,
    zip: state.zip,
  }))
  await refetch()
}
</script>

<template>
  <div class="py-12">
    <div
      v-if="!hasDirectLookup"
      class="mx-auto mb-12 max-w-sm"
    >
      <h1 class="mb-2 text-3xl font-medium">
        Track your guest order
      </h1>
      <p class="text-zinc-600">
        Enter the email, order ID, and shipping ZIP/postal code used at checkout.
      </p>
    </div>

    <UCard
      v-if="!hasDirectLookup"
      class="mx-auto mb-12 max-w-sm"
    >
      <UForm
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormGroup
          required
          label="Email"
          name="email"
        >
          <UInput
            v-model="state.email"
            type="email"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          required
          label="Order ID"
          name="order_id"
        >
          <UInput
            v-model="state.order_id"
            size="lg"
          />
        </UFormGroup>
        <UFormGroup
          required
          label="ZIP / Postal code"
          name="zip"
        >
          <UInput
            v-model="state.zip"
            size="lg"
          />
        </UFormGroup>
        <UButton
          type="submit"
          size="lg"
        >
          Find order
        </UButton>
      </UForm>
    </UCard>

    <div
      v-if="!isLoading"
      class="grid h-[40vh] w-full place-content-center text-center"
    >
      <div class="space-y-4 flex flex-col justify-center items-center">
        <LoadingSvg :child-class="'!w-12 !h-12'" />
        <p
          v-if="hasDirectLookup"
          class="text-sm text-zinc-600"
        >
          Loading your order details.
        </p>
      </div>
    </div>
    <div
      v-else-if="isBackendWakingUp"
      class="grid h-[40vh] w-full place-content-center text-center"
    >
      <div class="space-y-3">
        <LoadingSvg :child-class="'!w-12 !h-12'" />
        <p class="text-sm text-zinc-600">
          The server is waking up. Please wait a moment.
        </p>
      </div>
    </div>
    <div v-else-if="orderShops.length > 0">
      <div
        v-for="orderShop in orderShops"
        :key="orderShop.id"
      >
        <ShopItem :order-shop="orderShop" />
      </div>
    </div>
    <div
      v-else-if="route.query.token || route.query.session_id || route.query.order_id || route.query.order_ids"
      class="mx-auto max-w-2xl text-zinc-600"
    >
      No guest orders matched that lookup.
    </div>
  </div>
</template>
