<script setup lang="ts">
import AppIcon from '@arc/ui/primitives/app-icon.vue'
import Empty from '@arc/ui/patterns/empty.vue'
import ShopActions from '~/domains/me/ui/order-shop/shop-actions/shop-actions.vue'
import WriteProductReviewDialog from '~/domains/me/ui/order-shop/shop-actions/write-product-review-dialog/write-product-review-dialog.vue'
import OrderHeading from '~/domains/me/ui/order-shop/order-heading.vue'
import OrderPackagesOverview from '~/domains/me/ui/order-shop/order-packages-overview.vue'
import OrderPackageCard from '~/domains/me/ui/order-shop/order-package-card.vue'
import OrderAwaitingItemsCard from '~/domains/me/ui/order-shop/order-awaiting-items-card.vue'
import OrderSummaryCard from '~/domains/me/ui/order-shop/order-summary-card.vue'
import OrderPaymentCard from '~/domains/me/ui/order-shop/order-payment-card.vue'
import {
  buildAwaitingShipmentLines,
  buildOrderPackages,
  type OrderPackage,
} from '~/domains/me/ui/order-shop/order-detail-presentation'
import { routes } from '~/shared/navigation/routes'
import { useGetOrderById } from '~/domains/me/queries/orders/order-shops.query'
import {
  mergeOrderShopWithLiveUpdate,
  useOrderLiveUpdates,
} from '~/domains/me/realtime/order-live-updates'

definePageMeta({ layout: 'market', middleware: ['auth'] })

/** Detail cards render as single surfaces with the header close to the body. */
const dividerlessCardUi = {
  divide: 'divide-y-0',
  header: { padding: 'px-4 pt-5 pb-0 sm:px-6 sm:pt-6 sm:pb-0' },
  body: { padding: 'px-4 pb-5 pt-2 sm:px-6 sm:pb-6 sm:pt-3' },
}

const route = useRoute()
const orderId = computed(() => String(route.params.id ?? ''))

const dialog = useModal()

const {
  data: dataOrder,
  isPending: isPendingOrder,
} = useGetOrderById(orderId.value)

const { getUpdate } = useOrderLiveUpdates()

const displayOrderShop = computed(() => {
  const orderShop = dataOrder.value?.order_shop

  if (!orderShop) {
    return undefined
  }

  return mergeOrderShopWithLiveUpdate(orderShop, getUpdate(orderShop.id))
})

const orderPackages = computed(() => (
  displayOrderShop.value ? buildOrderPackages(displayOrderShop.value).packages : []
))

const awaitingLines = computed(() => (
  displayOrderShop.value ? buildAwaitingShipmentLines(displayOrderShop.value) : []
))

const shippingAddress = computed(() => displayOrderShop.value?.shipping_address)

const streetAddressLines = computed(() => {
  const address = shippingAddress.value

  if (!address) {
    return []
  }

  return [
    address.address1,
    address.address2,
    [address.city, address.state, address.zip].filter(Boolean).join(', '),
  ].filter(Boolean)
})

/** Order item ids of one package that still exist on the order (reviewable). */
function packageItemIds(pkg: OrderPackage): string[] {
  const orderShop = displayOrderShop.value

  if (!orderShop) {
    return []
  }

  return pkg.lines
    .map(line => line.orderItemId)
    .filter(id => orderShop.products.some(product => product.id === id))
}

function packageReviewed(pkg: OrderPackage): boolean {
  const orderShop = displayOrderShop.value

  if (!orderShop) {
    return false
  }

  const ids = packageItemIds(pkg)
  const products = orderShop.products.filter(product => ids.includes(product.id))

  return products.length > 0 && products.every(product => Boolean(product.my_review))
}

function openReview(pkg: OrderPackage) {
  const orderShop = displayOrderShop.value
  const orderItemIds = packageItemIds(pkg)

  if (!orderShop || orderItemIds.length === 0) {
    return
  }

  dialog.open(WriteProductReviewDialog, {
    orderShop,
    orderItemIds,
  })
}
</script>

<template>
  <div class="mt-8 space-y-6">
    <div class="flex flex-col gap-2">
      <NuxtLink
        :to="routes.orders()"
        class="text-primary inline-flex w-fit items-center gap-1 text-sm font-medium hover:underline"
      >
        <AppIcon
          name="chevronLeftSolid"
          size="xs"
        />
        Orders
      </NuxtLink>

      <Empty
        v-if="isPendingOrder"
        loading
        variant="naked"
        size="lg"
        class="min-h-[60vh]"
        title="Loading order"
      />

      <OrderHeading
        v-else-if="displayOrderShop"
        :order-shop="displayOrderShop"
      >
        <template #actions>
          <ShopActions
            v-if="displayOrderShop"
            :order-shop="displayOrderShop"
            :show-view-order-link="false"
            :show-review-cta="false"
            orientation="inline"
          />
        </template>
      </OrderHeading>

      <Empty
        v-else
        variant="outline"
        size="lg"
        icon="search"
        title="Order not found"
        description="We couldn't find this order. It may have been removed, or the link is incorrect."
        :actions="[{
          label: 'View orders',
          to: routes.orders(),
          color: 'gray',
        }]"
      />
    </div>

    <div
      v-if="displayOrderShop"
      class="grid grid-cols-1 gap-8 lg:grid-cols-12"
    >
      <div class="space-y-6 lg:col-span-9">
        <OrderPackagesOverview :order-shop="displayOrderShop" />

        <OrderPackageCard
          v-for="pkg in orderPackages"
          :key="pkg.id"
          :order-package="pkg"
          :show-package-index="orderPackages.length > 1"
          :show-stages="orderPackages.length > 1"
        >
          <template
            v-if="pkg.state === 'delivered' && packageItemIds(pkg).length > 0"
            #actions
          >
            <UButton
              color="gray"
              size="sm"
              @click="openReview(pkg)"
            >
              {{ packageReviewed(pkg) ? 'Edit review' : 'Write a review' }}
            </UButton>
          </template>
        </OrderPackageCard>

        <OrderAwaitingItemsCard
          v-if="awaitingLines.length"
          :lines="awaitingLines"
        />
      </div>

      <div class="space-y-4 lg:col-span-3">
        <OrderSummaryCard :order-shop="displayOrderShop" />

        <UCard :ui="dividerlessCardUi">
          <template #header>
            <div class="font-medium">
              Shipping address
            </div>
          </template>

          <div
            v-if="shippingAddress"
            class="space-y-4 text-sm"
          >
            <div class="space-y-1">
              <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
                Name
              </div>
              <div class="text-text-muted">
                {{ shippingAddress.full_name }}
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
                Address
              </div>
              <div class="text-text-muted">
                <div class="space-y-1">
                  <div
                    v-for="line in streetAddressLines"
                    :key="line"
                  >
                    {{ line }}
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="shippingAddress.country"
              class="space-y-1"
            >
              <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
                Country
              </div>
              <div class="text-text-muted">
                {{ shippingAddress.country }}
              </div>
            </div>

            <div
              v-if="shippingAddress.phone"
              class="space-y-1"
            >
              <div class="text-xs font-bold uppercase tracking-wide text-text-strong">
                Phone
              </div>
              <div class="text-text-muted">
                {{ shippingAddress.phone }}
              </div>
            </div>
          </div>
        </UCard>

        <OrderPaymentCard :order-shop="displayOrderShop" />
      </div>
    </div>
  </div>
</template>
