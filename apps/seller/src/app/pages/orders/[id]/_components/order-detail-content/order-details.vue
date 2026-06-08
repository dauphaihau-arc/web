<script setup lang="ts">
import DetailInfoCard from './detail-info-card.vue'
import DetailInfoItem from './detail-info-item.vue'
import type { ShopOrder } from './types'

const props = defineProps<{
  order: ShopOrder
}>()
</script>

<template>
  <DetailInfoCard title="Details">
    <div class="space-y-4 text-sm">
      <DetailInfoItem label="Payment">
        <span class="capitalize">{{ order.payment.type }}</span>
      </DetailInfoItem>

      <DetailInfoItem label="Shipping">
        <div class="capitalize">
          {{ order.shipping.shipping_status.replaceAll('_', ' ') }}
        </div>
      </DetailInfoItem>
    </div>
  </DetailInfoCard>
</template>
