<script setup lang="ts">
import type { AdminOrderDetailOrder } from '~/domains/orders/api/contracts/admin-orders.contract'
import Timeline from '@arc/ui/patterns/timeline.vue'
import { useAdminOrderTimelineItems } from '../_composables/use-admin-order-timeline-items'

const props = defineProps<{
  order: AdminOrderDetailOrder
}>()

const timelineItems = useAdminOrderTimelineItems(() => props.order)
</script>

<template>
  <div>
    <div class="font-semibold">
      Status tracking
    </div>

    <Timeline
      class="mt-5"
      :items="timelineItems"
    />
  </div>
</template>
