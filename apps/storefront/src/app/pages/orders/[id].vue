<script setup lang="ts">
import LoadingSvg from '@arc/ui/loading-svg.vue'
import ShopItem from './_components/shop-item/shop-item.vue'
import { routes } from '~/shared/navigation/routes'
import { useGetOrderById } from '~/shared/server-state/me/orders/order-shops.query'
import {
  mergeOrderShopWithLiveUpdate,
  useOrderLiveUpdates,
} from '~/shared/realtime/order-live-updates'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const route = useRoute()
const orderId = computed(() => String(route.params.id ?? ''))

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

const shippingAddressLines = computed(() => {
  const shippingAddress = displayOrderShop.value?.shipping_address

  if (!shippingAddress) {
    return []
  }

  return [
    shippingAddress.full_name,
    shippingAddress.address1,
    shippingAddress.address2,
    [shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(', '),
    shippingAddress.country,
    shippingAddress.phone,
  ].filter(Boolean)
})
</script>

<template>
  <div class="mt-8 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl">
          {{ displayOrderShop ? `Order ${displayOrderShop.order_number}` : 'Order details' }}
        </h1>
        <div class="text-sm text-text-muted">
          Review shipment status, address, and line items for this order.
        </div>
      </div>

      <UButton
        :to="routes.orders()"
        color="gray"
        variant="ghost"
      >
        Back to orders
      </UButton>
    </div>

    <div
      v-if="isPendingOrder"
      class="grid h-[60vh] w-full place-content-center"
    >
      <LoadingSvg :child-class="'!w-12 !h-12'" />
    </div>

    <div
      v-else-if="displayOrderShop"
      class="grid grid-cols-12 gap-8"
    >
      <div class="col-span-9">
        <ShopItem
          :order-shop="displayOrderShop"
          :show-detail-link="false"
        />
      </div>

      <div class="col-span-3 space-y-4">
        <UCard>
          <template #header>
            <div class="font-medium">
              Shipping address
            </div>
          </template>

          <div class="space-y-1 text-sm text-text-subtle">
            <div
              v-for="line in shippingAddressLines"
              :key="line"
            >
              {{ line }}
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="font-medium">
              Order status
            </div>
          </template>

          <div class="space-y-2 text-sm text-text-subtle">
            <div class="capitalize">
              Status: {{ displayOrderShop.status.replaceAll('_', ' ') }}
            </div>
            <div v-if="displayOrderShop.cancel_reason">
              Cancel reason: {{ displayOrderShop.cancel_reason }}
            </div>
            <div v-if="displayOrderShop.customer_support_note">
              Support request: {{ displayOrderShop.customer_support_note }}
            </div>
            <div v-if="displayOrderShop.payment.refund_status">
              Refund: {{ displayOrderShop.payment.refund_status.replaceAll('_', ' ') }}
            </div>
            <div v-if="displayOrderShop.payment.refund_failed_reason">
              Refund issue: {{ displayOrderShop.payment.refund_failed_reason }}
            </div>
            <div>
              Contact: {{ displayOrderShop.customer.email }}
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <div
      v-else
      class="rounded-md border border-border-subtle bg-surface p-6 text-sm text-text-muted"
    >
      Order not found.
    </div>
  </div>
</template>
