<script lang="ts" setup>
import dayjs from 'dayjs'
import { OrderShippingStatuses, OrderStatuses } from '@arc/enums/order'
import { buildTrackingUrl } from '@arc/utils/build-tracking-url'
import LoadingSvg from '~/shared/ui/loading-svg.vue'
import LayoutShopWrapperContent from '~/app/layouts/shop/wrapper-content.vue'
import SellerCancelOrderDialog from '~/app/components/dialogs/seller-cancel-order-dialog.vue'
import { routes } from '~/shared/navigation/routes'
import { useShopGetOrderDetail } from '~/shared/server-state/shop/order/detail.query'
import { useShopUpdateOrderShipment } from '~/shared/server-state/shop/order/update-shipment.mutation'

definePageMeta({ layout: 'shop', middleware: ['auth'] })

const route = useRoute()
const orderId = computed(() => String(route.params.id ?? ''))

const {
  data,
  isPending,
} = useShopGetOrderDetail(orderId.value)

const { mutateAsync: updateShipment, isPending: isUpdatingShipment } = useShopUpdateOrderShipment()
const dialog = useModal()

const shipmentForm = reactive({
  tracking_number: '',
  shipping_carrier: '',
  shipment_note: '',
})

watch(() => data.value?.order, (order) => {
  shipmentForm.tracking_number = order?.shipping.tracking_number ?? ''
  shipmentForm.shipping_carrier = order?.shipping.shipping_carrier ?? ''
  shipmentForm.shipment_note = order?.shipping.shipment_note ?? ''
}, { immediate: true })

const order = computed(() => data.value?.order)

const canCancel = computed(() =>
  !!order.value
  && [OrderStatuses.PAID, OrderStatuses.PENDING].includes(order.value.status)
  && order.value.shipping.shipping_status === OrderShippingStatuses.PRE_TRANSIT,
)

async function saveShipment(status?: OrderShippingStatuses) {
  if (!order.value) return

  await updateShipment({
    orderId: order.value.id,
    body: {
      ...(status ? { shipping_status: status } : {}),
      tracking_number: shipmentForm.tracking_number || undefined,
      shipping_carrier: shipmentForm.shipping_carrier || undefined,
      shipment_note: shipmentForm.shipment_note || undefined,
    },
  })
}

const addressLines = computed(() => {
  if (!order.value) return []
  const shippingAddress = order.value.shipping_address

  return [
    shippingAddress.full_name,
    shippingAddress.address1,
    shippingAddress.address2,
    [shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(', '),
    shippingAddress.country,
    shippingAddress.phone,
  ].filter(Boolean)
})

const trackingUrl = computed(() =>
  buildTrackingUrl(
    order.value?.shipping.shipping_carrier,
    order.value?.shipping.tracking_number,
  ),
)

function openTracking() {
  if (!trackingUrl.value) return
  navigateTo(trackingUrl.value, {
    external: true,
    open: {
      target: '_blank',
    },
  })
}

function openCancelDialog() {
  if (!order.value) return
  dialog.open(SellerCancelOrderDialog, {
    orderId: order.value.id,
  })
}
</script>

<template>
  <LayoutShopWrapperContent>
    <template #title>
      Order details
    </template>
    <template #actions>
      <UButton
        :to="routes.accountShopOrders()"
        color="gray"
        variant="ghost"
      >
        Back to orders
      </UButton>
    </template>
    <template #content>
      <div
        v-if="isPending"
        class="grid h-[70vh] w-full place-content-center"
      >
        <LoadingSvg :child-class="'!w-12 !h-12'" />
      </div>

      <div
        v-else-if="order"
        class="grid grid-cols-12 gap-6"
      >
        <div class="col-span-7 space-y-6">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-lg font-semibold">
                    Order #{{ order.id.slice(0, 8) }}
                  </div>
                  <div class="text-sm text-zinc-500">
                    {{ dayjs(order.created_at).format('MMM DD, YYYY HH:mm') }}
                  </div>
                </div>
                <div class="text-right">
                  <UBadge
                    color="gray"
                    variant="subtle"
                  >
                    {{ order.status.replaceAll('_', ' ') }}
                  </UBadge>
                  <div class="mt-2 text-xl font-semibold">
                    {{ convertCurrency(order.total) }}
                  </div>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="product in order.products"
                :key="product.id"
                class="flex items-start gap-3 border-b border-zinc-100 pb-4 last:border-b-0"
              >
                <NuxtImg
                  v-if="product.image_url"
                  :src="product.image_url"
                  width="64"
                  height="64"
                  class="rounded"
                />
                <div class="flex-1">
                  <div class="font-medium">
                    {{ product.title }}
                  </div>
                  <div class="text-sm text-zinc-500">
                    Qty: {{ product.quantity }}
                    <span v-if="product.inventory.variant">, Variant: {{ product.inventory.variant }}</span>
                  </div>
                </div>
                <div class="font-medium">
                  {{ convertCurrency(product.sale_price ?? product.price) }}
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="font-semibold">
                Shipment update
              </div>
            </template>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <UFormGroup label="Tracking number">
                  <UInput v-model="shipmentForm.tracking_number" />
                </UFormGroup>
                <UFormGroup label="Carrier">
                  <UInput v-model="shipmentForm.shipping_carrier" />
                </UFormGroup>
              </div>

              <UFormGroup label="Shipment note">
                <UTextarea
                  v-model="shipmentForm.shipment_note"
                  :rows="4"
                />
              </UFormGroup>

              <div class="flex flex-wrap gap-3">
                <UButton
                  :loading="isUpdatingShipment"
                  @click="saveShipment()"
                >
                  Save shipment info
                </UButton>
                <UButton
                  color="gray"
                  variant="soft"
                  :loading="isUpdatingShipment"
                  @click="saveShipment(OrderShippingStatuses.IN_TRANSIT)"
                >
                  Mark in transit
                </UButton>
                <UButton
                  color="gray"
                  variant="soft"
                  :loading="isUpdatingShipment"
                  @click="saveShipment(OrderShippingStatuses.SHIPPED)"
                >
                  Mark shipped
                </UButton>
                <UButton
                  color="gray"
                  variant="soft"
                  :loading="isUpdatingShipment"
                  @click="saveShipment(OrderShippingStatuses.DELIVERED)"
                >
                  Mark delivered
                </UButton>
                <UButton
                  v-if="canCancel"
                  color="red"
                  variant="soft"
                  @click="openCancelDialog"
                >
                  Cancel order
                </UButton>
              </div>
            </div>
          </UCard>
        </div>

        <div class="col-span-5 space-y-6">
          <UCard>
            <template #header>
              <div class="font-semibold">
                Customer
              </div>
            </template>

            <div class="space-y-1 text-sm text-zinc-600">
              <div class="font-medium text-zinc-900">
                {{ order.customer.full_name }}
              </div>
              <div>{{ order.customer.email }}</div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="font-semibold">
                Shipping address
              </div>
            </template>

            <div class="space-y-1 text-sm text-zinc-600">
              <div
                v-for="line in addressLines"
                :key="line"
              >
                {{ line }}
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <div class="font-semibold">
                Order summary
              </div>
            </template>

            <div class="space-y-2 text-sm text-zinc-600">
              <div class="flex justify-between">
                <span>Payment</span>
                <span class="capitalize">{{ order.payment.type }}</span>
              </div>
              <div class="flex justify-between">
                <span>Shipping</span>
                <span class="capitalize">{{ order.shipping.shipping_status.replaceAll('_', ' ') }}</span>
              </div>
              <div
                v-if="trackingUrl"
                class="pt-2"
              >
                <UButton
                  size="sm"
                  color="gray"
                  variant="ghost"
                  @click="openTracking"
                >
                  Open tracking
                </UButton>
              </div>
              <div class="flex justify-between">
                <span>Subtotal</span>
                <span>{{ convertCurrency(order.subtotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Discount</span>
                <span>{{ convertCurrency(order.total_discount) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Shipping fee</span>
                <span>{{ convertCurrency(order.total_shipping_fee) }}</span>
              </div>
              <UDivider />
              <div class="flex justify-between font-semibold text-zinc-900">
                <span>Total</span>
                <span>{{ convertCurrency(order.total) }}</span>
              </div>
              <div v-if="order.note">
                <div class="mb-1 font-medium text-zinc-900">
                  Buyer note
                </div>
                <div>{{ order.note }}</div>
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
    </template>
  </LayoutShopWrapperContent>
</template>
