<script lang="ts" setup>
import Timeline from '@arc/ui/primitives/timeline.vue'
import type { ShopOrder, ShopOrderTimelineEvent } from '~/shared/types/shop-order-detail'
import { useOrderTimelineItems } from '~/app/pages/orders/_composables/use-order-timeline-items'

const props = defineProps<{
  order: ShopOrder
  timeline: ShopOrderTimelineEvent[]
}>()

const timelineItems = useOrderTimelineItems(() => props.order, () => props.timeline)
</script>

<template>
  <div>
    <div class="font-semibold">
      Timeline
    </div>

    <Timeline
      class="mt-5"
      :items="timelineItems"
    />
  </div>
</template>
