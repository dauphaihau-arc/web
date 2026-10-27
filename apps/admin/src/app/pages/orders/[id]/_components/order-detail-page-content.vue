<script setup lang="ts">
import { ICON_NAME_BY_ALIAS } from '@arc/ui/foundation/app-icon.constants'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import LayoutAdminWrapperContent from '~/app/layouts/admin/wrapper-content.vue'
import {
  formatOrderDateTime,
  formatOrderStatusLabel,
  orderStatusTone,
} from '~/domains/orders/utils/order-presentation'
import { routes } from '~/shared/navigation/routes'
import OrdersPermissionState from '../../_components/orders-permission-state.vue'
import OrderCustomer from './order-customer.vue'
import OrderDetailActions from './order-detail-actions.vue'
import OrderDetails from './order-details.vue'
import OrderPricingBreakdown from './order-pricing-breakdown.vue'
import OrderShop from './order-shop.vue'
import OrderSummary from './order-summary.vue'
import OrderTracking from './order-tracking.vue'
import { useAdminOrderDetailPage } from '../_composables/use-admin-order-detail-page'

const props = defineProps<{
  orderId: string
}>()

const {
  order,
  query,
  isPermissionDenied,
  isNotFound,
  retry,
} = useAdminOrderDetailPage(() => props.orderId)
</script>

<template>
  <LayoutAdminWrapperContent
    back-label="Orders"
    :back-to="routes.orders()"
    content-class="pb-12"
  >
    <template #title>
      <span class="inline-flex flex-wrap items-center gap-3">
        <span>{{ order ? `Order ${order.order_number}` : 'Order details' }}</span>
        <StatusBadge
          v-if="order"
          :color="orderStatusTone(order.status)"
          class="capitalize"
        >
          {{ formatOrderStatusLabel(order.status) }}
        </StatusBadge>
      </span>
    </template>

    <template
      v-if="order"
      #description
    >
      Created {{ formatOrderDateTime(order.created_at) }}
    </template>

    <template #actions>
      <OrderDetailActions
        v-if="order"
        :order-id="order.id"
      />
    </template>

    <template #content>
      <OrdersPermissionState v-if="isPermissionDenied" />

      <Empty
        v-else-if="query.isPending.value"
        loading
        variant="naked"
        size="xl"
        description="Loading order..."
        container-class="min-h-[60vh]"
      />

      <Empty
        v-else-if="isNotFound"
        :icon="ICON_NAME_BY_ALIAS.orders"
        title="Order not found"
        description="This order may have been deleted, or the link is no longer valid."
        variant="naked"
        size="xl"
        container-class="min-h-[60vh]"
      />

      <Empty
        v-else-if="query.isError.value || !order"
        :icon="ICON_NAME_BY_ALIAS.warning"
        title="Could not load order"
        description="Something went wrong while loading this order. Please try again."
        variant="naked"
        size="xl"
        container-class="min-h-[60vh]"
      >
        <template #actions>
          <UButton
            color="gray"
            @click="retry"
          >
            Try again
          </UButton>
        </template>
      </Empty>

      <div
        v-else
        class="grid grid-cols-12 gap-6"
      >
        <div class="col-span-12 space-y-6 xl:col-span-9">
          <OrderSummary :order="order" />
          <OrderPricingBreakdown :order="order" />
          <UCard>
            <OrderTracking :order="order" />
          </UCard>
        </div>

        <div class="col-span-12 space-y-6 xl:col-span-3">
          <OrderShop :order="order" />
          <OrderCustomer :order="order" />
          <OrderDetails :order="order" />
        </div>
      </div>
    </template>
  </LayoutAdminWrapperContent>
</template>
