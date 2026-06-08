<script setup lang="ts">
type NotificationPopoverItem = {
  id: string
  title: string
  body: string
  data?: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

type NotificationPopoverFilter = {
  label: string
  value: string
}

withDefaults(defineProps<{
  notifications: NotificationPopoverItem[]
  unreadCount: number
  loading?: boolean
  error?: boolean
  isMarkingAll?: boolean
  isMarkingOne?: boolean
  filters?: NotificationPopoverFilter[]
  activeFilter?: string
  emptyText?: string
  showUnreadCount?: boolean
  viewAllLabel?: string
  tooltipText?: string
  preventTooltipWhenOpen?: boolean
}>(), {
  loading: false,
  error: false,
  isMarkingAll: false,
  isMarkingOne: false,
  filters: () => [],
  activeFilter: 'all',
  emptyText: 'No notifications yet.',
  showUnreadCount: true,
  viewAllLabel: 'View all',
  tooltipText: 'Notifications',
  preventTooltipWhenOpen: false,
})

const emit = defineEmits<{
  markAll: [close: () => void]
  viewAll: [close: () => void]
  itemClick: [notification: NotificationPopoverItem, close: () => void]
  filterChange: [value: string]
}>()

const isPopoverOpen = ref(false)
</script>

<template>
  <UPopover
    v-model:open="isPopoverOpen"
    :popper="{ placement: 'bottom-end' }"
  >
    <UChip
      :text="unreadCount"
      :show="unreadCount > 0"
      size="lg"
      position="bottom-right"
    >
      <UTooltip
        :text="tooltipText"
        :prevent="preventTooltipWhenOpen ? isPopoverOpen : false"
      >
        <UButton
          color="gray"
          variant="ghost"
          square
        >
          <AppIcon name="bell" />
        </UButton>
      </UTooltip>
    </UChip>

    <template #panel="{ close }">
      <NotificationPopoverPanel
        :notifications="notifications"
        :unread-count="unreadCount"
        :loading="loading"
        :error="error"
        :is-marking-all="isMarkingAll"
        :is-marking-one="isMarkingOne"
        :filters="filters"
        :active-filter="activeFilter"
        :empty-text="emptyText"
        :show-unread-count="showUnreadCount"
        :view-all-label="viewAllLabel"
        @filter-change="emit('filterChange', $event)"
        @mark-all="emit('markAll', close)"
        @item-click="emit('itemClick', $event, close)"
        @view-all="emit('viewAll', close)"
      />
    </template>
  </UPopover>
</template>
