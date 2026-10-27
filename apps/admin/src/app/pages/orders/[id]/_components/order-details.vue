<script setup lang="ts">
import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract'
import StatusBadge from '@arc/ui/primitives/status-badge.vue'
import {
  formatOrderDateTime,
  formatOrderStatusLabel,
  fulfillmentStatusTone,
  orderStatusTone,
  readRefundStatus,
} from '~/domains/orders/utils/order-presentation'
import DetailInfoCard from './detail-info-card.vue'
import DetailInfoItem from './detail-info-item.vue'

const props = defineProps<{
  order: AdminOrderDetailOrder
}>()

const refundStatus = computed(() => readRefundStatus(props.order))
</script>

<template>
  <DetailInfoCard title="Details">
    <div class="space-y-4 text-sm">
      <DetailInfoItem label="Order id">
        <span class="break-all font-mono text-xs">{{ order.id }}</span>
      </DetailInfoItem>

      <DetailInfoItem label="Order number">
        {{ order.order_number }}
      </DetailInfoItem>

      <DetailInfoItem label="Status">
        <StatusBadge
          :color="orderStatusTone(order.status)"
          class="capitalize"
        >
          {{ formatOrderStatusLabel(order.status) }}
        </StatusBadge>
      </DetailInfoItem>

      <DetailInfoItem label="Fulfillment">
        <StatusBadge
          :color="fulfillmentStatusTone(order.fulfillment.status)"
          class="capitalize"
        >
          {{ formatOrderStatusLabel(order.fulfillment.status) }}
        </StatusBadge>
      </DetailInfoItem>

      <DetailInfoItem label="Payment">
        <span class="capitalize">{{ formatOrderStatusLabel(order.payment.type) }}</span>
      </DetailInfoItem>

      <DetailInfoItem
        v-if="refundStatus"
        label="Refund"
      >
        <span class="capitalize">{{ formatOrderStatusLabel(refundStatus) }}</span>
      </DetailInfoItem>

      <DetailInfoItem
        v-if="order.refunded_at"
        label="Refunded at"
      >
        {{ formatOrderDateTime(order.refunded_at) }}
      </DetailInfoItem>

      <DetailInfoItem
        v-if="order.cancel_reason"
        label="Cancel reason"
      >
        {{ order.cancel_reason }}
      </DetailInfoItem>
    </div>
  </DetailInfoCard>
</template>
