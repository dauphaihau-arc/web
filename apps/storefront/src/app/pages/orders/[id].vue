<script setup lang="ts">
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import ShopItem from '~/app/components/order/shop-item/shop-item.vue'
import { routes } from '~/shared/navigation/routes'
import { useGetOrderById } from '~/shared/server-state/me/orders/order-shops.query'

definePageMeta({ layout: 'market', middleware: ['auth'] })

const route = useRoute()
const orderId = computed(() => String(route.params.id ?? ''))

const {
  data: dataOrder,
  isPending: isPendingOrder,
} = useGetOrderById(orderId.value)

const shippingAddressLines = computed(() => {
  const shippingAddress = dataOrder.value?.order_shop.shipping_address

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
          Order details
        </h1>
        <div class="text-sm text-zinc-500">
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
      v-else-if="dataOrder?.order_shop"
      class="grid grid-cols-12 gap-8"
    >
      <div class="col-span-9">
        <ShopItem
          :order-shop="dataOrder.order_shop"
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

          <div class="space-y-1 text-sm text-zinc-600">
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

          <div class="space-y-2 text-sm text-zinc-600">
            <div class="capitalize">
              Status: {{ dataOrder.order_shop.status.replaceAll('_', ' ') }}
            </div>
            <div v-if="dataOrder.order_shop.cancel_reason">
              Cancel reason: {{ dataOrder.order_shop.cancel_reason }}
            </div>
            <div v-if="dataOrder.order_shop.customer_support_note">
              Support request: {{ dataOrder.order_shop.customer_support_note }}
            </div>
            <div>
              Contact: {{ dataOrder.order_shop.customer.email }}
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <div
      v-else
      class="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-500"
    >
      Order not found.
    </div>
  </div>
</template>
