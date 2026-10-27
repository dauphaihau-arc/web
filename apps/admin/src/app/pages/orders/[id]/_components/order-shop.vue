<script setup lang="ts">
import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract'
import DetailInfoCard from './detail-info-card.vue'
import DetailInfoItem from './detail-info-item.vue'

defineProps<{
  order: AdminOrderDetailOrder
}>()
</script>

<template>
  <DetailInfoCard title="Shop">
    <div class="space-y-4 text-sm">
      <DetailInfoItem label="Shop name">
        {{ order.shop.shop_name }}
      </DetailInfoItem>
      <DetailInfoItem label="Slug">
        {{ order.shop.slug }}
      </DetailInfoItem>
      <DetailInfoItem label="Shop id">
        <span class="break-all font-mono text-xs">{{ order.shop.id }}</span>
      </DetailInfoItem>
    </div>
  </DetailInfoCard>
</template>
