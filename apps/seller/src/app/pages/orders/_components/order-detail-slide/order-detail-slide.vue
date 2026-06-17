<script lang="ts" setup>
import LoadingSvg from '@arc/ui/primitives/loading-svg.vue'
import Actions from './actions.vue'
import Customer from './customer.vue'
import Overview from './overview.vue'
import Summary from './summary.vue'
import Products from './products.vue'
import Timeline from './timeline.vue'
import { useOrderActions } from '~/app/pages/orders/[id]/_components/order-detail-content/use-order-actions'
import { routes } from '~/shared/navigation/routes'
import { useShopGetOrderDetail } from '~/shared/server-state/shop/order/detail.query'

const props = defineProps<{
  modelValue: boolean
  orderId?: string | null
  orderNumber?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const { data, isPending } = useShopGetOrderDetail(props.orderId ?? undefined)

const config = useRuntimeConfig()
const assetHost = computed(() => config.public.assetHost?.replace(/\/+$/, '') ?? '')
const order = computed(() => data.value?.order)
const timeline = computed(() => data.value?.timeline ?? [])
const {
  canCancel,
  canRefund,
  canRetryRefund,
  primaryShipmentAction,
} = useOrderActions(order)

const title = computed(() => order.value?.order_number ?? props.orderNumber ?? 'Order detail')
const hasFooterActions = computed(() =>
  !!primaryShipmentAction.value
  || canRefund.value
  || canRetryRefund.value
  || canCancel.value,
)
</script>

<template>
  <USlideover
    v-model="open"
    side="right"
    :ui="{ width: 'max-w-[min(92vw,600px)] sm:max-w-[min(92vw,600px)]' }"
  >
    <div class="flex h-full flex-col bg-surface">
      <div class="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4">
        <div class="min-w-0">
          <div class="truncate text-lg font-semibold">
            {{ title }}
          </div>
          <div class="text-sm text-text-muted">
            Order details
          </div>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            v-if="orderId"
            color="gray"
            variant="ghost"
            :to="routes.orderDetail(orderId)"
          >
            Open page
          </UButton>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            @click="open = false"
          />
        </div>
      </div>

      <div
        class="flex-1 overflow-y-auto px-6 py-4"
        :class="{ 'pb-28': hasFooterActions }"
      >
        <div
          v-if="isPending"
          class="grid h-[70vh] w-full place-content-center"
        >
          <LoadingSvg :child-class="'!w-12 !h-12'" />
        </div>

        <div
          v-else-if="order"
          class="space-y-4"
        >
          <Overview :order="order" />

          <UDivider />

          <Customer
            :customer="order.customer"
            :shipping-address="order.shipping_address"
          />

          <UDivider />

          <Timeline
            :order="order"
            :timeline="timeline"
          />

          <UDivider />

          <Products
            :asset-host="assetHost"
            :order="order"
          />

          <UDivider />

          <Summary :order="order" />
        </div>

        <div
          v-else
          class="rounded-md border border-border-subtle bg-surface p-6 text-sm text-text-muted"
        >
          Order not found.
        </div>
      </div>

      <div
        v-if="order && hasFooterActions"
        class="border-t border-border-subtle bg-surface px-5 py-4"
      >
        <Actions :order="order" />
      </div>
    </div>
  </USlideover>
</template>
