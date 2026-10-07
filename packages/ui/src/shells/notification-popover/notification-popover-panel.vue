<script setup lang="ts">
import dayjs from 'dayjs'
import { ICON_NAME_BY_ALIAS } from '../../foundation/app-icon.constants'

interface NotificationPopoverItem {
  id: string
  title: string
  body: string
  data?: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

interface NotificationPopoverFilter {
  label: string
  value: string
}

const props = withDefaults(defineProps<{
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
}>(), {
  loading: false,
  error: false,
  isMarkingAll: false,
  isMarkingOne: false,
  filters: () => [],
  activeFilter: 'all',
  emptyText: 'No notifications yet.',
  showUnreadCount: true,
})

const emit = defineEmits<{
  markAll: []
  itemClick: [notification: NotificationPopoverItem]
  filterChange: [value: string]
}>()

const activeFilterIndex = computed(() => props.filters.findIndex(filter => filter.value === props.activeFilter))
function formatNotificationTime(value: string) {
  const createdAt = dayjs(value)
  const now = dayjs()
  const minutesAgo = now.diff(createdAt, 'minute')

  if (minutesAgo < 1) {
    return 'Just now'
  }

  if (minutesAgo < 60) {
    return `${minutesAgo}m ago`
  }

  const hoursAgo = now.diff(createdAt, 'hour')

  if (hoursAgo < 24) {
    return `${hoursAgo}h ago`
  }

  if (createdAt.isSame(now.subtract(1, 'day'), 'day')) {
    return 'Yesterday'
  }

  if (createdAt.isSame(now, 'year')) {
    return createdAt.format('MMM DD')
  }

  return createdAt.format('MMM DD, YYYY')
}

function formatNotificationTitle(value: string) {
  return dayjs(value).format('MMM DD, YYYY HH:mm')
}


function handleFilterChange(index: number) {
  const filter = props.filters[index]

  if (!filter) {
    return
  }

  emit('filterChange', filter.value)
}
</script>

<template>
  <div class="flex max-h-[min(32rem,calc(100vh-5rem))] w-[25rem] max-w-[calc(100vw-2rem)] flex-col py-3">
    <div class="mb-3 flex items-center justify-between gap-3 px-3">
      <div class="text-sm font-semibold">
        Notifications
      </div>

      <UButton
        v-if="unreadCount > 0"
        size="xs"
        :loading="isMarkingAll"
        @click="emit('markAll')"
      >
        Mark all read
      </UButton>
    </div>

    <UTabs
      v-if="filters.length > 0"
      class="mb-3 w-full px-3"
      :items="filters"
      :model-value="activeFilterIndex"
      :ui="{
        list: {
          width: 'w-full md:w-full',
          height: 'h-9',
          padding: 'p-1',
          tab: {
            base: 'flex-1 justify-center',
            height: 'h-7',
            padding: 'px-2',
            size: 'text-xs',
            icon: 'w-3.5 h-3.5 me-1',
          },
        },
      }"
      @change="handleFilterChange"
    />

    <div class="scrollbar-subtle flex min-h-60 flex-1 flex-col overflow-y-auto overscroll-contain">
      <Empty
        v-if="loading"
        loading
        variant="naked"
        size="sm"
        description="Loading notifications..."
        container-class="flex-1"
      />

      <Empty
        v-else-if="error"
        variant="naked"
        size="sm"
        :icon="ICON_NAME_BY_ALIAS['warning']"
        description="Failed to load notifications."
        container-class="flex-1"
      />

      <Empty
        v-else-if="notifications.length === 0"
        variant="naked"
        size="sm"
        :icon="ICON_NAME_BY_ALIAS['bell']"
        :description="emptyText"
        container-class="flex-1"
      />

      <div
        v-else
      >
        <button
          v-for="notification in notifications"
          :key="notification.id"
          type="button"
          class="w-full border-b px-3 py-3 text-left transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isMarkingOne"
          @click="emit('itemClick', notification)"
        >
          <div class="mb-1 flex items-start justify-between gap-3">
            <div class="text-sm font-medium text-text-strong">
              {{ notification.title }}
            </div>
            <div
              class="shrink-0 text-xs text-text-muted"
              :title="formatNotificationTitle(notification.created_at)"
            >
              {{ formatNotificationTime(notification.created_at) }}
            </div>
          </div>
          <div class="text-sm text-text-subtle mt-2">
            {{ notification.body }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
