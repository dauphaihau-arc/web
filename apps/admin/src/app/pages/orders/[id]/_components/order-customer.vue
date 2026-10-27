<script setup lang="ts">
import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract'
import DetailInfoCard from './detail-info-card.vue'
import DetailInfoItem from './detail-info-item.vue'

const props = defineProps<{
  order: AdminOrderDetailOrder
}>()

const addressLines = computed<string[]>(() =>
  [
    props.order.shipping_address.address1,
    props.order.shipping_address.address2,
    [
      props.order.shipping_address.city,
      props.order.shipping_address.state,
      props.order.shipping_address.zip,
    ].filter(Boolean).join(', '),
    props.order.shipping_address.country,
  ].filter((line): line is string => Boolean(line)),
)
</script>

<template>
  <DetailInfoCard title="Customer">
    <div class="space-y-4 text-sm">
      <DetailInfoItem label="Email">
        <span class="break-all">{{ order.customer.email }}</span>
      </DetailInfoItem>

      <DetailInfoItem label="Recipient">
        {{ order.shipping_address.full_name }}
      </DetailInfoItem>

      <DetailInfoItem
        v-if="order.shipping_address.phone"
        label="Phone"
      >
        {{ order.shipping_address.phone }}
      </DetailInfoItem>

      <DetailInfoItem label="Shipping address">
        <div class="space-y-1">
          <div
            v-for="line in addressLines"
            :key="line"
          >
            {{ line }}
          </div>
        </div>
      </DetailInfoItem>
    </div>
  </DetailInfoCard>
</template>
