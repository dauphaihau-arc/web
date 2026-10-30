<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import OrderHeading from '~/domains/me/ui/order-shop/order-heading.vue'
import OrderPackagesOverview from '~/domains/me/ui/order-shop/order-packages-overview.vue'
import OrderPackageCard from '~/domains/me/ui/order-shop/order-package-card.vue'
import OrderAwaitingItemsCard from '~/domains/me/ui/order-shop/order-awaiting-items-card.vue'
import OrderSummaryCard from '~/domains/me/ui/order-shop/order-summary-card.vue'
import OrderPaymentCard from '~/domains/me/ui/order-shop/order-payment-card.vue'
import {
  buildAwaitingShipmentLines,
  buildOrderPackages,
} from '~/domains/me/ui/order-shop/order-detail-presentation'
import { useLookupGuestOrders } from '~/domains/checkout/queries/guest-orders.query'
import { routes } from '~/shared/navigation/routes'

definePageMeta({ layout: 'market' })

const route = useRoute()
const router = useRouter()
const hasDirectLookup = computed(() =>
  !!route.query.session_id
  || !!route.query.token
  || !!(
    route.query.email
    && (route.query.order_id || route.query.order_ids)
    && route.query.zip
  ),
)

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

/** One view model per order so packages and awaiting lines are derived once. */
const orderViews = computed(() => orderShops.value.map((orderShop) => {
  const packages = buildOrderPackages(orderShop).packages

  return {
    orderShop,
    packages,
    awaitingLines: buildAwaitingShipmentLines(orderShop),
  }
}))

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
      <p class="text-text-subtle">
        Enter the email, order number, and shipping ZIP/postal code used at checkout.
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
          label="Order number"
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

    <Empty
      v-if="isLoading"
      loading
      variant="naked"
      size="lg"
      class="min-h-[40vh]"
      title="Loading your order details"
    />
    <div v-else-if="orderShops.length > 0">
      <div
        v-for="view in orderViews"
        :key="view.orderShop.id"
        class="space-y-6"
      >
        <OrderHeading :order-shop="view.orderShop" />

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div class="space-y-6 lg:col-span-9">
            <OrderPackagesOverview :order-shop="view.orderShop" />

            <OrderPackageCard
              v-for="pkg in view.packages"
              :key="pkg.id"
              :order-package="pkg"
              :show-package-index="view.packages.length > 1"
              :show-stages="view.packages.length > 1"
            />

            <OrderAwaitingItemsCard
              v-if="view.awaitingLines.length"
              :lines="view.awaitingLines"
            />
          </div>

          <div class="space-y-4 lg:col-span-3">
            <OrderSummaryCard :order-shop="view.orderShop" />

            <OrderPaymentCard :order-shop="view.orderShop" />
          </div>
        </div>
      </div>
    </div>
    <Empty
      v-else-if="route.query.token || route.query.session_id || route.query.order_id || route.query.order_ids"
      class="mx-auto max-w-2xl"
      variant="outline"
      size="lg"
      icon="search"
      title="No guest orders found"
      description="We couldn't match that email, order number, and ZIP / postal code. Check the details and try again."
    />
  </div>
</template>
