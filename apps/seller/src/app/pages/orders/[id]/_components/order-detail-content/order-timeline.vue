<script lang="ts" setup>
import Timeline from '@arc/ui/timeline.vue'
import type { ShopOrder, ShopOrderTimelineEvent } from './types'
import { useOrderTimelineItems } from '~/app/pages/orders/_composables/use-order-timeline-items'

const props = defineProps<{
  order: ShopOrder
  timeline: ShopOrderTimelineEvent[]
}>()

const timelineItems = useOrderTimelineItems(() => props.order, () => props.timeline)
</script>

<template>
  <UCard>
    <div class="text-lg font-semibold">
      Order tracking
    </div>

    <Timeline
      class="mt-6"
      :items="timelineItems"
    />
  </UCard>
</template>
