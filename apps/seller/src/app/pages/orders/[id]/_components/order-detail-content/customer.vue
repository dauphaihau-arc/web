<script lang="ts" setup>
import DetailInfoCard from './detail-info-card.vue'
import DetailInfoItem from './detail-info-item.vue'
import type { ShopOrder } from '~/domains/shop/order/types/shop-order-detail'

defineProps<{
  order: ShopOrder
}>()
</script>

<template>
  <DetailInfoCard title="Customer">
    <div class="space-y-4 text-sm">
      <DetailInfoItem label="Name">
        {{ order.customer.full_name }}
      </DetailInfoItem>
      <DetailInfoItem label="Email">
        {{ order.customer.email }}
      </DetailInfoItem>
    </div>
  </DetailInfoCard>
</template>
